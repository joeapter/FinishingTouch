export const formatEstimateNumber = (value: number): string =>
  `EST-${String(value).padStart(6, '0')}`;

export const formatInvoiceNumber = (value: number): string =>
  `INV-${String(value).padStart(6, '0')}`;

export const extractSequenceNumber = (
  value: string | null | undefined,
): number => {
  if (!value) {
    return 0;
  }

  const maybeNumber = Number(value.split('-')[1]);
  if (Number.isNaN(maybeNumber)) {
    return 0;
  }

  return maybeNumber;
};
