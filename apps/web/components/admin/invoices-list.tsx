'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { InvoiceStatusBadge } from './status-badge';
import { PageShell } from './page-shell';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { apiRequest } from '@/lib/api-client';
import { formatMoney } from '@/lib/format';
import type { Invoice } from '@/types/models';

const statuses = ['ALL', 'DRAFT', 'SENT', 'PAID', 'VOID'] as const;

export function InvoicesListView() {
  const { data: session } = useSession();
  const token = session?.accessToken;

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<(typeof statuses)[number]>('ALL');

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (search) {
      params.set('search', search);
    }
    if (status !== 'ALL') {
      params.set('status', status);
    }

    const value = params.toString();
    return value ? `?${value}` : '';
  }, [search, status]);

  const invoicesQuery = useQuery({
    queryKey: ['invoices', queryString, token],
    queryFn: () => apiRequest<Invoice[]>(`/invoices${queryString}`, { token }),
    enabled: Boolean(token),
  });

  return (
    <PageShell title="Invoices" description="Track invoice status and open printable documents.">
      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="grid gap-3 sm:grid-cols-[1fr_220px]">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by number or customer"
            />
            <Select value={status} onChange={(event) => setStatus(event.target.value as typeof status)}>
              {statuses.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoicesQuery.data?.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell>
                    <Link
                      href={`/admin/invoices/${invoice.id}`}
                      className="font-semibold text-slate-900 hover:underline"
                    >
                      {invoice.number}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm font-medium text-slate-800">{invoice.customerName}</p>
                    <p className="text-xs text-slate-500">{invoice.customerEmail}</p>
                  </TableCell>
                  <TableCell>
                    <InvoiceStatusBadge status={invoice.status} />
                  </TableCell>
                  <TableCell className="text-right font-semibold text-slate-900">
                    {formatMoney(invoice.total, invoice.currencySymbol)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {!invoicesQuery.data?.length ? (
            <p className="text-sm text-slate-500">No invoices found.</p>
          ) : null}
        </CardContent>
      </Card>
    </PageShell>
  );
}
