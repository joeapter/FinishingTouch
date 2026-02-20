'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { apiRequest } from '@/lib/api-client';
import { formatDateTime } from '@/lib/format';
import type { Employee, TimeEntry } from '@/types/models';

export function PunchClockView() {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const queryClient = useQueryClient();

  const [employeeId, setEmployeeId] = useState('');
  const [geolocationEnabled, setGeolocationEnabled] = useState(false);

  const employeesQuery = useQuery({
    queryKey: ['punch', 'employees', token],
    queryFn: () => apiRequest<Employee[]>('/employees', { token }),
    enabled: Boolean(token),
  });

  const entriesQuery = useQuery({
    queryKey: ['punch', 'entries', token],
    queryFn: () => apiRequest<TimeEntry[]>('/time-entries', { token }),
    enabled: Boolean(token),
  });

  const clockedInQuery = useQuery({
    queryKey: ['punch', 'clocked-in', token],
    queryFn: () => apiRequest<TimeEntry[]>('/time-entries/clocked-in/employees', { token }),
    enabled: Boolean(token),
  });

  const punchMutation = useMutation({
    mutationFn: (action: 'IN' | 'OUT') =>
      apiRequest('/time-entries/punch', {
        method: 'POST',
        token,
        body: {
          employeeId,
          action,
          geolocationEnabled,
        },
      }),
    onSuccess: (_data, action) => {
      toast.success(action === 'IN' ? 'Clocked in' : 'Clocked out');
      queryClient.invalidateQueries({ queryKey: ['punch', 'entries'] });
      queryClient.invalidateQueries({ queryKey: ['punch', 'clocked-in'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (error) => {
      toast.error(error.message || 'Punch action failed');
    },
  });

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>Punch Clock</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
            <Select value={employeeId} onChange={(event) => setEmployeeId(event.target.value)}>
              <option value="">Select employee</option>
              {employeesQuery.data?.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name}
                </option>
              ))}
            </Select>
            <Button
              onClick={() => punchMutation.mutate('IN')}
              disabled={!employeeId || punchMutation.isPending}
            >
              Clock In
            </Button>
            <Button
              variant="outline"
              onClick={() => punchMutation.mutate('OUT')}
              disabled={!employeeId || punchMutation.isPending}
            >
              Clock Out
            </Button>
          </div>

          <label className="inline-flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={geolocationEnabled}
              onChange={(event) => setGeolocationEnabled(event.target.checked)}
            />
            Geolocation flag (default off)
          </label>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Currently Clocked In</CardTitle>
          </CardHeader>
          <CardContent>
            {clockedInQuery.data?.length ? (
              <div className="space-y-2">
                {clockedInQuery.data.map((entry) => (
                  <div key={entry.id} className="rounded-md bg-slate-50 px-3 py-2 text-sm">
                    <p className="font-semibold text-slate-900">{entry.employee.name}</p>
                    <p className="text-xs text-slate-600">Since {formatDateTime(entry.clockIn)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No one is currently clocked in.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Entries</CardTitle>
          </CardHeader>
          <CardContent>
            {entriesQuery.data?.length ? (
              <div className="space-y-2">
                {entriesQuery.data.slice(0, 10).map((entry) => (
                  <div key={entry.id} className="rounded-md bg-slate-50 px-3 py-2 text-sm">
                    <p className="font-semibold text-slate-900">{entry.employee.name}</p>
                    <p className="text-xs text-slate-600">
                      {formatDateTime(entry.clockIn)} -{' '}
                      {entry.clockOut ? formatDateTime(entry.clockOut) : 'Open'}
                    </p>
                    <p className="text-xs text-slate-600">
                      Duration: {entry.durationMinutes ?? 0} minutes
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No entries yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
