import { PageShell } from '@/components/admin/page-shell';
import { EstimateDetailView } from '@/components/admin/estimate-detail';

export default async function EstimateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <PageShell title="Estimate Detail" description="Customer snapshot, pricing, and actions.">
      <EstimateDetailView id={id} />
    </PageShell>
  );
}
