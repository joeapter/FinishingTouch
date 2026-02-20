'use client';

import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { Download } from 'lucide-react';
import { toast } from 'sonner';
import { InvoiceStatusBadge } from './status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { apiPdf, apiRequest } from '@/lib/api-client';
import { formatMoney } from '@/lib/format';
import type { Invoice, InvoiceStatus } from '@/types/models';

const statuses: InvoiceStatus[] = ['DRAFT', 'SENT', 'PAID', 'VOID'];

export function InvoiceDetailView({ id }: { id: string }) {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const queryClient = useQueryClient();

  const invoiceQuery = useQuery({
    queryKey: ['invoice', id, token],
    queryFn: () => apiRequest<Invoice>(`/invoices/${id}`, { token }),
    enabled: Boolean(token),
  });

  const updateMutation = useMutation({
    mutationFn: (status: InvoiceStatus) =>
      apiRequest<Invoice>(`/invoices/${id}`, {
        method: 'PATCH',
        token,
        body: { status },
      }),
    onSuccess: () => {
      toast.success('Invoice updated');
      queryClient.invalidateQueries({ queryKey: ['invoice', id] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });

  const handlePdf = async () => {
    if (!token) {
      return;
    }

    const blob = await apiPdf(`/invoices/${id}/pdf`, token);
    const url = window.URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  const invoice = invoiceQuery.data;

  if (!invoice) {
    return <p className="text-sm text-slate-500">Loading invoice...</p>;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <InvoiceStatusBadge status={invoice.status} />
        <Select
          value={invoice.status}
          onChange={(event) => updateMutation.mutate(event.target.value as InvoiceStatus)}
          className="w-[180px]"
        >
          {statuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </Select>
        <Button variant="outline" onClick={handlePdf}>
          <Download className="mr-2 h-4 w-4" />
          Generate PDF
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Customer Details</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-700">
          <p className="font-semibold text-slate-900">{invoice.customerName}</p>
          <p>{invoice.customerJobAddress}</p>
          <p>{invoice.customerPhone}</p>
          <p>{invoice.customerEmail}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Line Items</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead className="text-right">Price</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.lineItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.description}</TableCell>
                  <TableCell>{item.qty}</TableCell>
                  <TableCell className="text-right">
                    {formatMoney(item.totalPrice, invoice.currencySymbol)}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell className="font-semibold">Subtotal</TableCell>
                <TableCell />
                <TableCell className="text-right font-semibold">
                  {formatMoney(invoice.subtotal, invoice.currencySymbol)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-semibold">Tax</TableCell>
                <TableCell />
                <TableCell className="text-right font-semibold">
                  {formatMoney(invoice.tax, invoice.currencySymbol)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-semibold">Total</TableCell>
                <TableCell />
                <TableCell className="text-right text-base font-bold">
                  {formatMoney(invoice.total, invoice.currencySymbol)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div>
        <Link href="/admin/invoices" className="text-sm text-slate-600 hover:text-slate-900">
          ← Back to invoices
        </Link>
      </div>
    </div>
  );
}
