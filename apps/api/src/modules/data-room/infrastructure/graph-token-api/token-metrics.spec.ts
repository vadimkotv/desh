import { describe, expect, it } from 'vitest';
import { ownTokenShareBps, stableBalanceUsd, top10ConcentrationBps, uniqueSenders } from './token-metrics';

const holder = (address: string, amount: string) => ({ address, amount, decimals: 18, symbol: 'T' });

describe('token metrics', () => {
  it('computes top-10 concentration in bps', () => {
    const holders = [holder('a', '900'), holder('b', '100')];
    expect(top10ConcentrationBps(holders)).toBe(10_000);
    const spread = Array.from({ length: 20 }, (_, i) => holder(`h${i}`, '10'));
    expect(top10ConcentrationBps(spread)).toBe(5_000);
    expect(top10ConcentrationBps([])).toBe(0);
  });

  it('counts unique senders case-insensitively', () => {
    const t = (from: string) => ({ from, to: 'x', timestamp: 0 });
    expect(uniqueSenders([t('0xA'), t('0xa'), t('0xB')])).toBe(2);
  });

  it('sums stablecoin balances at 1:1', () => {
    const balances = [
      { contract: '0x1', amount: '5000000', decimals: 6, symbol: 'USDC' },
      { contract: '0x2', amount: '2000000000000000000', decimals: 18, symbol: 'DAI' },
      { contract: '0x3', amount: '1', decimals: 18, symbol: 'WETH' },
    ];
    expect(stableBalanceUsd(balances)).toBe(7);
  });

  it('computes own-token share of the treasury', () => {
    const balances = [
      { contract: '0xOWN', amount: '3000000', decimals: 6, symbol: 'OWN' },
      { contract: '0x1', amount: '1000000', decimals: 6, symbol: 'USDC' },
    ];
    expect(ownTokenShareBps(balances, '0xown')).toBe(7_500);
    expect(ownTokenShareBps(balances, undefined)).toBe(0);
  });
});
