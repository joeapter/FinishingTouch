import { PageShell } from '@/components/admin/page-shell';
import { PunchClockView } from '@/components/admin/punch-clock-view';

export default function PunchClockPage() {
  return (
    <PageShell title="Punch Clock" description="Clock employees in and out in real time.">
      <PunchClockView />
    </PageShell>
  );
}
