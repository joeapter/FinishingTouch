import { PageShell } from '@/components/admin/page-shell';
import { ScheduleView } from '@/components/admin/schedule-view';

export default function SchedulePage() {
  return (
    <PageShell title="Schedule" description="Plan jobs on calendar and assign crews.">
      <ScheduleView />
    </PageShell>
  );
}
