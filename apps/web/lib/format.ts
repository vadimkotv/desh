// Money, date and address formatting shared by every page. Locale is pinned to
// en-US and dates to UTC so server and client render identical strings.
const number = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });
const compact = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 });

export const usdc = (amount: number): string => `${number.format(amount)} USDC`;
export const usdcCompact = (amount: number): string => `${compact.format(amount)} USDC`;
export const num = (value: number): string => number.format(value);
export const compactNum = (value: number): string => compact.format(value);

// x402 receipts carry atomic USDC (6 decimals) as a string.
export const atomicUsdc = (atomic: string | number): number => {
  const value = Number(atomic);
  return Number.isFinite(value) ? value / 1_000_000 : 0;
};

export function shortAddress(address: string, chars = 4): string {
  if (address.length <= chars * 2 + 2) return address;
  return `${address.slice(0, chars + 2)}…${address.slice(-chars)}`;
}

export const shortId = (id: string): string => id.split('-')[0] ?? id.slice(0, 8);

export function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return `${date.toISOString().slice(0, 16).replace('T', ' ')} UTC`;
}

export function formatTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toISOString().slice(11, 23);
}

export function countdown(deadline: string, now = Date.now()): { label: string; expired: boolean } {
  const ms = new Date(deadline).getTime() - now;
  if (Number.isNaN(ms)) return { label: 'unknown deadline', expired: false };
  if (ms <= 0) return { label: 'deadline passed', expired: true };
  const minutes = Math.floor(ms / 60_000);
  const days = Math.floor(minutes / 1_440);
  const hours = Math.floor((minutes % 1_440) / 60);
  if (days > 0) return { label: `${days}d ${hours}h`, expired: false };
  if (hours > 0) return { label: `${hours}h ${minutes % 60}m`, expired: false };
  return { label: `${minutes}m`, expired: false };
}

export const percent = (part: number, whole: number): number =>
  whole > 0 ? Math.min(100, Math.max(0, (part / whole) * 100)) : 0;

export const bpsToPercent = (bps: number): string => `${(bps / 100).toFixed(bps % 100 === 0 ? 0 : 1)}%`;

export const ratioToPercent = (ratio: number): string => `${Math.round(ratio * 100)}%`;

export const arcAddressUrl = (address: string): string =>
  `https://testnet.arcscan.app/address/${address}`;

export const hashscanTopicUrl = (topicId: string): string =>
  `https://hashscan.io/testnet/topic/${topicId}`;

export const hashscanAccountUrl = (accountId: string): string =>
  `https://hashscan.io/testnet/account/${accountId}`;

export function signalValue(value: number, unit?: string): string {
  if (unit === 'usd') return `$${number.format(value)}`;
  if (unit === 'bps') return bpsToPercent(value);
  if (unit === 'days') return `${number.format(value)} d`;
  return number.format(value);
}
