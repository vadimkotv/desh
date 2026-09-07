import { describe, expect, it } from 'vitest';
import { evaluateSpend } from './spending-policy';

const mandate = {
  thesis: 'Back early DeFi infra with real on-chain traction',
  sectors: ['defi'],
  minScore: 60,
  maxTicketUsdc: 500,
  maxPerRoundShareBps: 2_000,
  dailyBudgetUsdc: 800,
  maxDataSpendUsdc: 1,
  riskTolerance: 'balanced' as const,
};
const round = { targetUsdc: 10_000, raisedUsdc: 0, minTicketUsdc: 10 };

describe('evaluateSpend', () => {
  it('allows an amount inside every cap', () => {
    const v = evaluateSpend({ mandate, round, proposedUsdc: 100, spentTodayUsdc: 0 });
    expect(v).toEqual({ allowed: true, amountUsdc: 100, reason: 'within mandate' });
  });

  it('clamps to max ticket', () => {
    const v = evaluateSpend({ mandate, round, proposedUsdc: 900, spentTodayUsdc: 0 });
    expect(v.amountUsdc).toBe(500);
    expect(v.reason).toContain('maxTicketUsdc');
  });

  it('clamps to per-round share (20% of 1000 = 200)', () => {
    const small = { ...round, targetUsdc: 1_000 };
    const v = evaluateSpend({ mandate, round: small, proposedUsdc: 400, spentTodayUsdc: 0 });
    expect(v.amountUsdc).toBe(200);
  });

  it('respects remaining daily budget and wallet balance', () => {
    const v = evaluateSpend({ mandate, round, proposedUsdc: 300, spentTodayUsdc: 700, walletBalanceUsdc: 50 });
    expect(v.amountUsdc).toBe(50);
  });

  it('denies when the clamped amount falls under the min ticket', () => {
    const v = evaluateSpend({ mandate, round, proposedUsdc: 300, spentTodayUsdc: 795 });
    expect(v.allowed).toBe(false);
  });

  it('denies zero proposals', () => {
    expect(evaluateSpend({ mandate, round, proposedUsdc: 0, spentTodayUsdc: 0 }).allowed).toBe(false);
  });
});
