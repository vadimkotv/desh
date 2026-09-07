import { SignalKeys, type Signal } from '@agentipo/shared';
import { describe, expect, it } from 'vitest';
import { DistributionEvaluator } from './evaluators/distribution.evaluator';
import { TractionEvaluator } from './evaluators/traction.evaluator';
import { buildReport } from './report.builder';

const sig = (key: string, value: number): Signal => ({
  key, value, source: 'graph-token-api', observedAt: new Date().toISOString(),
});
const round = { targetUsdc: 10_000, raisedUsdc: 0, deadline: new Date(Date.now() + 86_400_000).toISOString() };

describe('buildReport', () => {
  it('scores only known categories and reports coverage', () => {
    const signals = [sig(SignalKeys.holdersCount, 4_000), sig(SignalKeys.topTenConcentrationBps, 3_000)];
    const report = buildReport([new DistributionEvaluator(), new TractionEvaluator()], signals, round);
    expect(report.dataCoverage).toBe(0.5);
    expect(report.findings.map((f) => f.verdict)).toEqual(['strong', 'unknown']);
    expect(report.score).toBeGreaterThan(70);
    expect(report.summary).toContain('No data for: traction');
  });

  it('penalises whale concentration', () => {
    const concentrated = [sig(SignalKeys.holdersCount, 4_000), sig(SignalKeys.topTenConcentrationBps, 9_500)];
    const report = buildReport([new DistributionEvaluator()], concentrated, round);
    expect(report.score).toBeLessThan(45);
    expect(report.findings[0]?.verdict).toBe('weak');
  });

  it('returns zero score and coverage with no evaluators', () => {
    const report = buildReport([], [], round);
    expect(report.score).toBe(0);
    expect(report.dataCoverage).toBe(0);
  });
});
