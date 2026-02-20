import { PageShell } from '@/components/admin/page-shell';
import { EmployeesView } from '@/components/admin/employees-view';

export default function EmployeesPage() {
  return (
    <PageShell title="Employees" description="Manage team members and review timesheets.">
      <EmployeesView />
    </PageShell>
  );
}
