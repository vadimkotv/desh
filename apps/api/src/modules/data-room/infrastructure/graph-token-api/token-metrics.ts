import type { TokenBalance, TokenHolder, TokenTransfer } from './token-api.client';

const STABLES = new Set(['USDC', 'USDT', 'DAI', 'EURC', 'USDS', 'PYUSD']);

const toUnits = (amount: string, decimals: number): number => Number(amount) / 10 ** decimals;

// Pure metric functions over Token API rows. Unit-tested, no I/O.
export function top10ConcentrationBps(holders: TokenHolder[]): number {
  const amounts = holders.map((h) => Number(h.amount)).sort((a, b) => b - a);
  const total = amounts.reduce((s, a) => s + a, 0);
  if (total === 0) return 0;
  const top = amounts.slice(0, 10).reduce((s, a) => s + a, 0);
  return Math.round((top / total) * 10_000);
}

export function uniqueSenders(transfers: TokenTransfer[]): number {
  return new Set(transfers.map((t) => t.from.toLowerCase())).size;
}

export function stableBalanceUsd(balances: TokenBalance[]): number {
  return balances
    .filter((b) => STABLES.has(b.symbol.toUpperCase()))
    .reduce((s, b) => s + toUnits(b.amount, b.decimals), 0);
}

export function ownTokenShareBps(balances: TokenBalance[], tokenAddress: string | undefined): number {
  if (!tokenAddress) return 0;
  const own = balances.find((b) => b.contract.toLowerCase() === tokenAddress.toLowerCase());
  if (!own) return 0;
  const units = balances.map((b) => toUnits(b.amount, b.decimals));
  const total = units.reduce((s, u) => s + u, 0);
  return total === 0 ? 0 : Math.round((toUnits(own.amount, own.decimals) / total) * 10_000);
}
