import { PageShell } from '@/components/admin/page-shell';
import { InvoiceDetailView } from '@/components/admin/invoice-detail';

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <PageShell title="Invoice Detail" description="Review totals and download the PDF.">
      <InvoiceDetailView id={id} />
    </PageShell>
  );
}
