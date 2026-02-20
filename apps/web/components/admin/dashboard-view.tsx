'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiRequest } from '@/lib/api-client';
import { formatDateTime } from '@/lib/format';
import type { Estimate, Job, TimeEntry } from '@/types/models';

export function DashboardView() {
  const { data: session } = useSession();

  const token = session?.accessToken;

  const todayRange = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    return {
      from: start.toISOString(),
      to: end.toISOString(),
    };
  }, []);

  const jobsQuery = useQuery({
    queryKey: ['dashboard', 'jobs', todayRange.from, todayRange.to, token],
    queryFn: () =>
      apiRequest<Job[]>(
        `/jobs?from=${encodeURIComponent(todayRange.from)}&to=${encodeURIComponent(todayRange.to)}`,
        { token },
      ),
    enabled: Boolean(token),
  });

  const estimatesQuery = useQuery({
    queryKey: ['dashboard', 'estimates', token],
    queryFn: () => apiRequest<Estimate[]>('/estimates', { token }),
    enabled: Boolean(token),
  });

  const clockedInQuery = useQuery({
    queryKey: ['dashboard', 'clocked-in', token],
    queryFn: () => apiRequest<TimeEntry[]>('/time-entries/clocked-in/employees', { token }),
    enabled: Boolean(token),
  });

  const openEstimates = (estimatesQuery.data || []).filter((estimate) =>
    ['DRAFT', 'SENT', 'ACCEPTED'].includes(estimate.status),
  );

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard label="Today's Jobs" value={jobsQuery.data?.length || 0} />
        <MetricCard label="Open Estimates" value={openEstimates.length} />
        <MetricCard label="Clocked In" value={clockedInQuery.data?.length || 0} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Today&apos;s Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            {jobsQuery.data?.length ? (
              <div className="space-y-3">
                {jobsQuery.data.map((job) => (
                  <div
                    key={job.id}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3"
                  >
                    <p className="text-sm font-semibold text-slate-900">{job.title}</p>
                    <p className="text-xs text-slate-600">{job.address}</p>
                    <p className="text-xs text-slate-600">
                      {formatDateTime(job.startDateTime)} - {formatDateTime(job.endDateTime)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No jobs scheduled for today.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Who&apos;s Clocked In</CardTitle>
          </CardHeader>
          <CardContent>
            {clockedInQuery.data?.length ? (
              <ul className="space-y-2">
                {clockedInQuery.data.map((entry) => (
                  <li key={entry.id} className="rounded-md bg-slate-50 px-3 py-2 text-sm">
                    <p className="font-semibold text-slate-900">{entry.employee.name}</p>
                    <p className="text-xs text-slate-600">Since {formatDateTime(entry.clockIn)}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">No active clock-ins.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
        <p className="mt-1 text-3xl font-bold text-slate-900">{value}</p>
      </CardContent>
    </Card>
  );
}
