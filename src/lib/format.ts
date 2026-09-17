const usdWhole = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const usdCents = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function formatUSD(amount: number): string {
  return usdWhole.format(amount);
}

export function formatUSDPrecise(amount: number): string {
  return usdCents.format(amount);
}

export function formatPct(fraction: number, decimals = 0): string {
  return `${(fraction * 100).toFixed(decimals)}%`;
}

export function formatSignedUSD(amount: number): string {
  const formatted = formatUSD(Math.abs(amount));
  return amount < 0 ? `-${formatted}` : formatted;
}
