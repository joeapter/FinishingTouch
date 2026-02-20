import { PageShell } from '@/components/admin/page-shell';
import { EstimateWizard } from '@/components/admin/estimate-wizard';

export default function NewEstimatePage() {
  return (
    <PageShell
      title="Create Estimate"
      description="Use the guided wizard to build a customer-ready estimate quickly."
    >
      <EstimateWizard />
    </PageShell>
  );
}
