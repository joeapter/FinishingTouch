'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { Plus } from 'lucide-react';
import { PageShell } from './page-shell';
import { EstimateStatusBadge } from './status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { apiRequest } from '@/lib/api-client';
import { formatDate, formatMoney } from '@/lib/format';
import type { Estimate } from '@/types/models';

const statuses = ['ALL', 'DRAFT', 'SENT', 'ACCEPTED', 'DECLINED', 'INVOICED'] as const;

export function EstimatesListView() {
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

  const estimatesQuery = useQuery({
    queryKey: ['estimates', queryString, token],
    queryFn: () => apiRequest<Estimate[]>(`/estimates${queryString}`, { token }),
    enabled: Boolean(token),
  });

  return (
    <PageShell
      title="Estimates"
      description="Search, filter, and manage estimate lifecycle."
      actions={
        <Link href="/admin/estimates/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Estimate
          </Button>
        </Link>
      }
    >
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
                <TableHead>Estimate</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Moving Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {estimatesQuery.data?.map((estimate) => (
                <TableRow key={estimate.id}>
                  <TableCell>
                    <Link
                      href={`/admin/estimates/${estimate.id}`}
                      className="font-semibold text-slate-900 hover:underline"
                    >
                      {estimate.number}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm font-medium text-slate-800">{estimate.customerName}</p>
                    <p className="text-xs text-slate-500">{estimate.customerEmail}</p>
                  </TableCell>
                  <TableCell>{formatDate(estimate.movingDate)}</TableCell>
                  <TableCell>
                    <EstimateStatusBadge status={estimate.status} />
                  </TableCell>
                  <TableCell className="text-right font-semibold text-slate-900">
                    {formatMoney(estimate.total, estimate.currencySymbol)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {!estimatesQuery.data?.length ? (
            <p className="text-sm text-slate-500">No estimates found.</p>
          ) : null}
        </CardContent>
      </Card>
    </PageShell>
  );
}
