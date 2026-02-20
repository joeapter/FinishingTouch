'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { apiRequest } from '@/lib/api-client';
import { formatDateTime } from '@/lib/format';
import type { Employee, Role, TimeEntry } from '@/types/models';

type TimesheetResponse = {
  entries: TimeEntry[];
  totalMinutes: number;
};

export function EmployeesView() {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<Role>('EMPLOYEE');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const employeesQuery = useQuery({
    queryKey: ['employees', token],
    queryFn: () => apiRequest<Employee[]>('/employees', { token }),
    enabled: Boolean(token),
  });

  const timesheetsQuery = useQuery({
    queryKey: ['timesheets', selectedEmployeeId, from, to, token],
    queryFn: () =>
      apiRequest<TimesheetResponse>(
        `/employees/${selectedEmployeeId}/timesheets?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
        { token },
      ),
    enabled: Boolean(token && selectedEmployeeId && from && to),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      apiRequest<Employee>('/employees', {
        method: 'POST',
        token,
        body: { name, phone, role },
      }),
    onSuccess: () => {
      toast.success('Employee created');
      setName('');
      setPhone('');
      setRole('EMPLOYEE');
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<Pick<Employee, 'name' | 'phone' | 'role'>>;
    }) =>
      apiRequest<Employee>(`/employees/${id}`, {
        method: 'PATCH',
        token,
        body: payload,
      }),
    onSuccess: () => {
      toast.success('Employee updated');
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/employees/${id}`, {
        method: 'DELETE',
        token,
      }),
    onSuccess: () => {
      toast.success('Employee deleted');
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });

  const canCreate = useMemo(() => name.trim().length > 1 && phone.trim().length > 5, [name, phone]);

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>Add Employee</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-4">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="employee-name">Name</Label>
            <Input id="employee-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="employee-phone">Phone</Label>
            <Input id="employee-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="employee-role">Role</Label>
            <Select id="employee-role" value={role} onChange={(e) => setRole(e.target.value as Role)}>
              <option value="ADMIN">ADMIN</option>
              <option value="MANAGER">MANAGER</option>
              <option value="EMPLOYEE">EMPLOYEE</option>
            </Select>
          </div>
          <div className="sm:col-span-4">
            <Button onClick={() => createMutation.mutate()} disabled={!canCreate || createMutation.isPending}>
              Create Employee
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Employees</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employeesQuery.data?.map((employee) => (
                <EmployeeRow
                  key={employee.id}
                  employee={employee}
                  onUpdate={(payload) =>
                    updateMutation.mutate({ id: employee.id, payload })
                  }
                  onDelete={() => deleteMutation.mutate(employee.id)}
                  onSelectTimesheet={() => setSelectedEmployeeId(employee.id)}
                />
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Timesheets</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <Select
              value={selectedEmployeeId}
              onChange={(event) => setSelectedEmployeeId(event.target.value)}
            >
              <option value="">Select employee</option>
              {employeesQuery.data?.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name}
                </option>
              ))}
            </Select>
            <Input type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
            <Input type="date" value={to} onChange={(event) => setTo(event.target.value)} />
          </div>

          {timesheetsQuery.data ? (
            <>
              <p className="text-sm font-semibold text-slate-700">
                Total: {timesheetsQuery.data.totalMinutes} minutes
              </p>
              <div className="space-y-2">
                {timesheetsQuery.data.entries.map((entry) => (
                  <div key={entry.id} className="rounded-md bg-slate-50 px-3 py-2 text-sm">
                    <p>
                      {formatDateTime(entry.clockIn)} -{' '}
                      {entry.clockOut ? formatDateTime(entry.clockOut) : 'Open'}
                    </p>
                    <p className="text-xs text-slate-600">
                      Duration: {entry.durationMinutes ?? 0} minutes
                    </p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-500">Select employee and range to view timesheets.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function EmployeeRow({
  employee,
  onUpdate,
  onDelete,
  onSelectTimesheet,
}: {
  employee: Employee;
  onUpdate: (payload: Partial<Pick<Employee, 'name' | 'phone' | 'role'>>) => void;
  onDelete: () => void;
  onSelectTimesheet: () => void;
}) {
  const [name, setName] = useState(employee.name);
  const [phone, setPhone] = useState(employee.phone);
  const [role, setRole] = useState<Role>(employee.role);

  return (
    <TableRow>
      <TableCell>
        <Input value={name} onChange={(event) => setName(event.target.value)} />
      </TableCell>
      <TableCell>
        <Input value={phone} onChange={(event) => setPhone(event.target.value)} />
      </TableCell>
      <TableCell>
        <Select value={role} onChange={(event) => setRole(event.target.value as Role)}>
          <option value="ADMIN">ADMIN</option>
          <option value="MANAGER">MANAGER</option>
          <option value="EMPLOYEE">EMPLOYEE</option>
        </Select>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onUpdate({ name, phone, role })}
          >
            Save
          </Button>
          <Button size="sm" variant="secondary" onClick={onSelectTimesheet}>
            Timesheet
          </Button>
          <Button size="sm" variant="destructive" onClick={onDelete}>
            Delete
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
