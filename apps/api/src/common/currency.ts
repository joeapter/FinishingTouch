export const formatCurrency = (value: number, symbol: string): string => {
  const absolute = Math.abs(value);
  const formatted = `${symbol}${absolute.toLocaleString('en-US')}`;

  if (value < 0) {
    return `-${formatted}`;
  }

  return formatted;
};
