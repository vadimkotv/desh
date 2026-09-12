import { type Finding, SignalKeys } from '@agentipo/shared';
import type { EvaluationContext, SignalEvaluator } from '../evaluator.port';
import { clamp, finding, fmtUsd, logScore, unknownFinding } from '../scoring';

// Doubling over the observed window scores 100; flat scores 0; shrinking is punished.
const slopeScore = (growthBps: number): number => clamp((growthBps / 10_000) * 100);

// A short window proves little even if the slope looks great, so the score is
// discounted until several months of readings exist.
const confidence = (spanDays: number): number => clamp(logScore(spanDays, 180) / 100, 0.25, 1);

// Growth: the only category that reads metrics as a trajectory rather than a level.
// 2 000 USDC of MRR flat for six months and 2 000 USDC growing 1 500 a month are
// opposite investments, and a composite score that cannot tell them apart is useless.
export class GrowthEvaluator implements SignalEvaluator {
  readonly category = 'growth';
  readonly weight = 0.25;
  readonly requiredKeys = [SignalKeys.mrrGrowthBps, SignalKeys.activeUsersGrowthBps];

  evaluate({ signals }: EvaluationContext): Finding {
    const revenue = signals.get(SignalKeys.mrrGrowthBps);
    const users = signals.get(SignalKeys.activeUsersGrowthBps);
    // Pre-revenue startups are normal; either trajectory is enough to judge on.
    if (revenue === undefined && users === undefined) {
      return unknownFinding(this.category, this.weight, this.requiredKeys);
    }

    const spanDays = signals.get(SignalKeys.metricsSpanDays) ?? 0;
    const parts: string[] = [];
    let raw = 0;
    let weight = 0;

    if (revenue !== undefined) {
      raw += slopeScore(revenue) * 0.65;
      weight += 0.65;
      parts.push(this.describe('MRR', signals.get(SignalKeys.mrrUsd), signals.get(SignalKeys.mrrPerMonthUsd), revenue, true));
    }
    if (users !== undefined) {
      raw += slopeScore(users) * 0.35;
      weight += 0.35;
      parts.push(this.describe('active users', signals.get(SignalKeys.activeUsers), signals.get(SignalKeys.activeUsersPerMonth), users, false));
    }

    const score = (raw / weight) * confidence(spanDays);
    const window = `${(spanDays / 30).toFixed(1)} months of readings`;
    return finding(this.category, this.weight, score, `${parts.join('; ')} — over ${window}`, this.requiredKeys);
  }

  private describe(label: string, latest = 0, perMonth = 0, growthBps = 0, usd = false): string {
    const level = usd ? fmtUsd(latest) : latest.toLocaleString('en-US');
    const rate = usd ? `${perMonth >= 0 ? '+' : '−'}${fmtUsd(Math.abs(perMonth))}/mo` : `${perMonth >= 0 ? '+' : '−'}${Math.abs(Math.round(perMonth))}/mo`;
    return `${label} ${level}, ${rate} (${(growthBps / 100).toFixed(0)}% over the window)`;
  }
}
