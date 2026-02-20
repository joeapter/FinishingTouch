import { CURRENCY_SYMBOL } from './env';

export function formatMoney(value: number, symbol: string = CURRENCY_SYMBOL) {
  return `${symbol}${value.toLocaleString('en-US')}`;
}

export function formatDate(value: string | Date) {
  const date = new Date(value);
  return date.toLocaleDateString('en-IL', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(value: string | Date) {
  const date = new Date(value);
  return date.toLocaleString('en-IL', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
