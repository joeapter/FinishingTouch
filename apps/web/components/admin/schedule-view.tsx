'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { apiRequest } from '@/lib/api-client';
import type { Employee, Estimate, Job } from '@/types/models';

export function ScheduleView() {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const queryClient = useQueryClient();

  const [title, setTitle] = useState('');
  const [address, setAddress] = useState('');
  const [startDateTime, setStartDateTime] = useState('');
  const [endDateTime, setEndDateTime] = useState('');
  const [estimateId, setEstimateId] = useState('');
  const [employeeIds, setEmployeeIds] = useState<string[]>([]);
  const [createFromEstimateId, setCreateFromEstimateId] = useState('');

  const jobsQuery = useQuery({
    queryKey: ['jobs', token],
    queryFn: () => apiRequest<Job[]>('/jobs', { token }),
    enabled: Boolean(token),
  });

  const employeesQuery = useQuery({
    queryKey: ['schedule', 'employees', token],
    queryFn: () => apiRequest<Employee[]>('/employees', { token }),
    enabled: Boolean(token),
  });

  const estimatesQuery = useQuery({
    queryKey: ['schedule', 'estimates', token],
    queryFn: () => apiRequest<Estimate[]>('/estimates', { token }),
    enabled: Boolean(token),
  });

  const acceptedEstimates = useMemo(
    () => (estimatesQuery.data || []).filter((estimate) => estimate.status === 'ACCEPTED'),
    [estimatesQuery.data],
  );

  const createMutation = useMutation({
    mutationFn: () =>
      apiRequest<Job>('/jobs', {
        method: 'POST',
        token,
        body: {
          title,
          address,
          startDateTime,
          endDateTime,
          estimateId: estimateId || undefined,
          employeeIds,
        },
      }),
    onSuccess: () => {
      toast.success('Job created');
      setTitle('');
      setAddress('');
      setStartDateTime('');
      setEndDateTime('');
      setEstimateId('');
      setEmployeeIds([]);
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const createFromEstimateMutation = useMutation({
    mutationFn: () =>
      apiRequest<Job>(`/jobs/from-estimate/${createFromEstimateId}`, {
        method: 'POST',
        token,
        body: {
          employeeIds,
        },
      }),
    onSuccess: () => {
      toast.success('Job created from accepted estimate');
      setCreateFromEstimateId('');
      setEmployeeIds([]);
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const events = useMemo(
    () =>
      (jobsQuery.data || []).map((job) => ({
        id: job.id,
        title: job.title,
        start: job.startDateTime,
        end: job.endDateTime,
      })),
    [jobsQuery.data],
  );

  return (
    <div className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Create Job</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="job-title">Title</Label>
              <Input id="job-title" value={title} onChange={(event) => setTitle(event.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="job-address">Address</Label>
              <Input
                id="job-address"
                value={address}
                onChange={(event) => setAddress(event.target.value)}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="job-start">Start</Label>
                <Input
                  id="job-start"
                  type="datetime-local"
                  value={startDateTime}
                  onChange={(event) => setStartDateTime(event.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="job-end">End</Label>
                <Input
                  id="job-end"
                  type="datetime-local"
                  value={endDateTime}
                  onChange={(event) => setEndDateTime(event.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="job-estimate">Linked Estimate (optional)</Label>
              <Select id="job-estimate" value={estimateId} onChange={(e) => setEstimateId(e.target.value)}>
                <option value="">None</option>
                {(estimatesQuery.data || []).map((estimate) => (
                  <option key={estimate.id} value={estimate.id}>
                    {estimate.number} - {estimate.customerName}
                  </option>
                ))}
              </Select>
            </div>
            <EmployeePicker
              employees={employeesQuery.data || []}
              selectedEmployeeIds={employeeIds}
              onChange={setEmployeeIds}
            />
            <Button
              onClick={() => createMutation.mutate()}
              disabled={!title || !address || !startDateTime || !endDateTime}
            >
              Create Job
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Create Job From Accepted Estimate</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Select
              value={createFromEstimateId}
              onChange={(event) => setCreateFromEstimateId(event.target.value)}
            >
              <option value="">Select accepted estimate</option>
              {acceptedEstimates.map((estimate) => (
                <option key={estimate.id} value={estimate.id}>
                  {estimate.number} - {estimate.customerName}
                </option>
              ))}
            </Select>
            <EmployeePicker
              employees={employeesQuery.data || []}
              selectedEmployeeIds={employeeIds}
              onChange={setEmployeeIds}
            />
            <Button
              variant="outline"
              onClick={() => createFromEstimateMutation.mutate()}
              disabled={!createFromEstimateId}
            >
              Create From Estimate
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Schedule Calendar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay',
              }}
              events={events}
              height="auto"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function EmployeePicker({
  employees,
  selectedEmployeeIds,
  onChange,
}: {
  employees: Employee[];
  selectedEmployeeIds: string[];
  onChange: (values: string[]) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>Assign Employees</Label>
      <div className="grid gap-2 sm:grid-cols-2">
        {employees.map((employee) => {
          const checked = selectedEmployeeIds.includes(employee.id);

          return (
            <label
              key={employee.id}
              className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm"
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={(event) => {
                  if (event.target.checked) {
                    onChange([...selectedEmployeeIds, employee.id]);
                    return;
                  }

                  onChange(selectedEmployeeIds.filter((id) => id !== employee.id));
                }}
              />
              {employee.name}
            </label>
          );
        })}
      </div>
    </div>
  );
}
