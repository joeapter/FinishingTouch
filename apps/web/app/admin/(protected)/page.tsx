import { PageShell } from '@/components/admin/page-shell';
import { DashboardView } from '@/components/admin/dashboard-view';

export default function AdminDashboardPage() {
  return (
    <PageShell
      title="Dashboard"
      description="Track today's jobs, open estimates, and active crews."
    >
      <DashboardView />
    </PageShell>
  );
}
