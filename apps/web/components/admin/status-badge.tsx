import { Badge } from '@/components/ui/badge';
import type { EstimateStatus, InvoiceStatus } from '@/types/models';

export function EstimateStatusBadge({ status }: { status: EstimateStatus }) {
  if (status === 'ACCEPTED' || status === 'INVOICED') {
    return <Badge variant="success">{status}</Badge>;
  }

  if (status === 'DECLINED') {
    return <Badge variant="danger">{status}</Badge>;
  }

  if (status === 'SENT') {
    return <Badge variant="warning">{status}</Badge>;
  }

  return <Badge variant="secondary">{status}</Badge>;
}

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  if (status === 'PAID') {
    return <Badge variant="success">{status}</Badge>;
  }

  if (status === 'VOID') {
    return <Badge variant="danger">{status}</Badge>;
  }

  if (status === 'SENT') {
    return <Badge variant="warning">{status}</Badge>;
  }

  return <Badge variant="secondary">{status}</Badge>;
}
