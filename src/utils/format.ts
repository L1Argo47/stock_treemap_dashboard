export function formatMarketCap(value: number): string {
  if (value >= 1_000_000_000_000) {
    return `${(value / 1_000_000_000_000).toFixed(1)}조`;
  }
  if (value >= 100_000_000) {
    return `${(value / 100_000_000).toFixed(0)}억`;
  }
  return value.toLocaleString('ko-KR');
}

export function formatPrice(value: number): string {
  return value.toLocaleString('ko-KR') + '원';
}

export function formatChange(value: number): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}
