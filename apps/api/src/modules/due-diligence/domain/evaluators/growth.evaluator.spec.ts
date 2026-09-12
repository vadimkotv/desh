import { describe, expect, it } from 'vitest';
import { SignalKeys, type Signal } from '@agentipo/shared';
import { GrowthEvaluator } from './growth.evaluator';
import { SignalMap } from '../signal-map';

const round = { targetUsdc: 1_000, raisedUsdc: 0, deadline: new Date().toISOString() };
const sig = (key: string, value: number): Signal => ({
  key,
  value,
  source: 'founder-metrics',
  observedAt: new Date().toISOString(),
});

const evaluate = (signals: Signal[]) =>
  new GrowthEvaluator().evaluate({ signals: new SignalMap(signals), round });

describe('GrowthEvaluator', () => {
  it('separates a level from a trajectory: same MRR, opposite verdicts', () => {
    const span = sig(SignalKeys.metricsSpanDays, 180);
    const level = sig(SignalKeys.mrrUsd, 2_000);

    const growing = evaluate([level, sig(SignalKeys.mrrPerMonthUsd, 1_500), sig(SignalKeys.mrrGrowthBps, 30_000), span]);
    const flat = evaluate([level, sig(SignalKeys.mrrPerMonthUsd, 0), sig(SignalKeys.mrrGrowthBps, 0), span]);

    expect(growing.score).toBeGreaterThan(flat.score);
    expect(growing.verdict).toBe('strong');
    expect(flat.verdict).toBe('weak');
  });

  it('is unknown — not zero — when the founder published no trajectory', () => {
    const finding = evaluate([sig(SignalKeys.mrrUsd, 9_000)]);
    expect(finding.verdict).toBe('unknown');
  });

  it('judges a pre-revenue startup on user growth alone', () => {
    const finding = evaluate([
      sig(SignalKeys.activeUsers, 1_450),
      sig(SignalKeys.activeUsersPerMonth, 220),
      sig(SignalKeys.activeUsersGrowthBps, 12_000),
      sig(SignalKeys.metricsSpanDays, 150),
    ]);
    expect(finding.verdict).not.toBe('unknown');
    expect(finding.rationale).toContain('active users');
  });

  it('discounts a steep slope measured over a few days', () => {
    const steep = (spanDays: number) =>
      evaluate([
        sig(SignalKeys.mrrUsd, 2_000),
        sig(SignalKeys.mrrPerMonthUsd, 5_000),
        sig(SignalKeys.mrrGrowthBps, 20_000),
        sig(SignalKeys.metricsSpanDays, spanDays),
      ]).score;

    expect(steep(10)).toBeLessThan(steep(180));
  });

  it('punishes shrinkage rather than treating it as no news', () => {
    const finding = evaluate([
      sig(SignalKeys.mrrUsd, 800),
      sig(SignalKeys.mrrPerMonthUsd, -400),
      sig(SignalKeys.mrrGrowthBps, -4_000),
      sig(SignalKeys.metricsSpanDays, 180),
    ]);
    expect(finding.score).toBe(0);
    expect(finding.verdict).toBe('weak');
  });
});
