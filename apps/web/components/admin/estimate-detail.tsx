'use client';

import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { Download, Send, FilePlus2 } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { EstimateStatusBadge } from './status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { apiPdf, apiRequest } from '@/lib/api-client';
import { formatDate, formatMoney } from '@/lib/format';
import type { Estimate, EstimateStatus } from '@/types/models';

const statusOptions: EstimateStatus[] = [
  'DRAFT',
  'SENT',
  'ACCEPTED',
  'DECLINED',
  'INVOICED',
];

export function EstimateDetailView({ id }: { id: string }) {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const queryClient = useQueryClient();

  const estimateQuery = useQuery({
    queryKey: ['estimate', id, token],
    queryFn: () => apiRequest<Estimate>(`/estimates/${id}`, { token }),
    enabled: Boolean(token),
  });

  const updateStatusMutation = useMutation({
    mutationFn: (status: EstimateStatus) =>
      apiRequest<Estimate>(`/estimates/${id}`, {
        method: 'PATCH',
        token,
        body: { status },
      }),
    onSuccess: () => {
      toast.success('Status updated');
      queryClient.invalidateQueries({ queryKey: ['estimate', id] });
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
    },
  });

  const sendMutation = useMutation({
    mutationFn: () => apiRequest<{ ok: boolean; message: string }>(`/estimates/${id}/send`, {
      method: 'POST',
      token,
    }),
    onSuccess: (result) => {
      toast.success(result.message || 'Estimate emailed successfully.');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to send estimate email.');
    },
  });

  const convertMutation = useMutation({
    mutationFn: () =>
      apiRequest<{ id: string }>(`/estimates/${id}/convert-to-invoice`, {
        method: 'POST',
        token,
      }),
    onSuccess: (invoice) => {
      toast.success('Converted to invoice');
      queryClient.invalidateQueries({ queryKey: ['estimate', id] });
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      window.location.href = `/admin/invoices/${invoice.id}`;
    },
  });

  const handlePdf = async () => {
    if (!token) {
      return;
    }

    const blob = await apiPdf(`/estimates/${id}/pdf`, token);
    const url = window.URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  const estimate = estimateQuery.data;

  const bedsLine = useMemo(() => {
    return estimate?.lineItems.find((item) => item.description.includes('Bedrooms'));
  }, [estimate]);

  if (!estimate) {
    return <p className="text-sm text-slate-500">Loading estimate...</p>;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <EstimateStatusBadge status={estimate.status} />
        <Select
          value={estimate.status}
          onChange={(event) =>
            updateStatusMutation.mutate(event.target.value as EstimateStatus)
          }
          className="w-[180px]"
        >
          {statusOptions.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </Select>
        <Button variant="outline" onClick={handlePdf}>
          <Download className="mr-2 h-4 w-4" />
          Generate PDF
        </Button>
        <Button variant="outline" onClick={() => sendMutation.mutate()}>
          <Send className="mr-2 h-4 w-4" />
          Send
        </Button>
        <Button onClick={() => convertMutation.mutate()}>
          <FilePlus2 className="mr-2 h-4 w-4" />
          Convert to Invoice
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Customer Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm text-slate-700">
            <p className="font-semibold text-slate-900">{estimate.customerName}</p>
            <p>{estimate.customerJobAddress}</p>
            <p>{estimate.customerPhone}</p>
            <p>{estimate.customerEmail}</p>
            <Separator className="my-3" />
            <p>
              <span className="font-semibold">Estimate:</span> {estimate.number}
            </p>
            <p>
              <span className="font-semibold">Moving Date:</span> {formatDate(estimate.movingDate)}
            </p>
            {bedsLine ? (
              <p>
                <span className="font-semibold">Bedroom Beds:</span>{' '}
                {bedsLine.description.replace('Bedrooms ', '')}
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estimate PDF + Web Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-slate-300 bg-white p-4 text-sm">
              <div className="flex items-start justify-between">
                <img src="/logo-placeholder.png" alt="Logo" className="h-10 w-auto" />
                <div className="text-right">
                  <p className="font-bold text-slate-900">{estimate.number}</p>
                  <p className="text-xs text-slate-600">
                    Moving date: {formatDate(estimate.movingDate)}
                  </p>
                </div>
              </div>
              <div className="ml-[25px] mt-4 text-xs text-slate-700">
                <p>{estimate.customerName}</p>
                <p>{estimate.customerJobAddress}</p>
                <p>{estimate.customerPhone}</p>
                <p>{estimate.customerEmail}</p>
              </div>

              <table className="mt-4 w-full border-collapse text-xs">
                <thead>
                  <tr>
                    <th className="border border-slate-300 bg-slate-100 px-2 py-1 text-left">
                      Description
                    </th>
                    <th className="border border-slate-300 bg-slate-100 px-2 py-1 text-right">
                      Qty
                    </th>
                    <th className="border border-slate-300 bg-slate-100 px-2 py-1 text-right">
                      Price
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {estimate.lineItems.map((item) => (
                    <tr key={item.id}>
                      <td className="border border-slate-300 px-2 py-1">{item.description}</td>
                      <td className="border border-slate-300 px-2 py-1 text-right">{item.qty}</td>
                      <td className="border border-slate-300 px-2 py-1 text-right">
                        {formatMoney(item.totalPrice, estimate.currencySymbol)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="ml-auto mt-3 w-[220px] space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatMoney(estimate.subtotal, estimate.currencySymbol)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax</span>
                  <span>{formatMoney(estimate.tax, estimate.currencySymbol)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-800 pt-1 text-sm font-semibold">
                  <span>Total</span>
                  <span>{formatMoney(estimate.total, estimate.currencySymbol)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <Link href="/admin/estimates" className="text-sm text-slate-600 hover:text-slate-900">
          ← Back to estimates
        </Link>
      </div>
    </div>
  );
}
