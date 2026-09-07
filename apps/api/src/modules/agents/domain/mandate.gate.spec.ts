import { describe, expect, it } from 'vitest';
import { mandateGate } from './mandate.gate';

const base = {
  thesis: 'Back DeFi infra with real usage',
  sectors: ['defi'],
  minScore: 60,
  maxTicketUsdc: 100,
  maxPerRoundShareBps: 1000,
  dailyBudgetUsdc: 500,
  maxDataSpendUsdc: 1,
  riskTolerance: 'balanced' as const,
};

describe('mandateGate', () => {
  it('passes when score and coverage satisfy the mandate', () => {
    expect(mandateGate(base, { score: 72, dataCoverage: 0.7 }).pass).toBe(true);
  });

  it('rejects low coverage before looking at the score', () => {
    const r = mandateGate({ ...base, riskTolerance: 'conservative' }, { score: 95, dataCoverage: 0.6 });
    expect(r.pass).toBe(false);
    expect(r.reason).toContain('coverage');
  });

  it('rejects scores under minScore', () => {
    expect(mandateGate(base, { score: 59.9, dataCoverage: 1 }).pass).toBe(false);
  });

  it('lets aggressive mandates through on thin data', () => {
    expect(mandateGate({ ...base, riskTolerance: 'aggressive' }, { score: 65, dataCoverage: 0.35 }).pass).toBe(true);
  });
});
