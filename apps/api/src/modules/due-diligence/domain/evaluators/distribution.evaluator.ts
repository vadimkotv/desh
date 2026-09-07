import { type Finding, SignalKeys } from '@agentipo/shared';
import type { EvaluationContext, SignalEvaluator } from '../evaluator.port';
import { clamp, finding, logScore, unknownFinding } from '../scoring';

// Who holds the token? Many holders and low whale concentration → healthy distribution.
export class DistributionEvaluator implements SignalEvaluator {
  readonly category = 'distribution';
  readonly weight = 0.2;
  readonly requiredKeys = [SignalKeys.holdersCount, SignalKeys.topTenConcentrationBps];

  evaluate({ signals }: EvaluationContext): Finding {
    const missing = signals.missing(this.requiredKeys);
    if (missing.length) return unknownFinding(this.category, this.weight, missing);

    const holders = signals.get(SignalKeys.holdersCount) ?? 0;
    const top10 = (signals.get(SignalKeys.topTenConcentrationBps) ?? 10_000) / 100;
    const breadth = logScore(holders, 5_000);
    const concentrationPenalty = clamp((top10 - 40) * 1.5, 0, 60);
    const score = clamp(breadth - concentrationPenalty);
    const rationale = `${holders} holders sampled; top-10 hold ${top10.toFixed(1)}% of supply`;
    return finding(this.category, this.weight, score, rationale, this.requiredKeys);
  }
}
