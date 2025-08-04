export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatPrice = (amount: number): string => {
  return `¥${amount.toLocaleString('ja-JP')}`;
};

export const parseCurrency = (currencyString: string): number => {
  return parseInt(currencyString.replace(/[^\d]/g, '')) || 0;
};
