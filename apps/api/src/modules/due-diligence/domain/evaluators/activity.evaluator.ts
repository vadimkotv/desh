import { type Finding, SignalKeys } from '@agentipo/shared';
import type { EvaluationContext, SignalEvaluator } from '../evaluator.port';
import { finding, logScore, unknownFinding } from '../scoring';

// Is the token actually used? Transfer count and distinct senders over 30 days.
export class ActivityEvaluator implements SignalEvaluator {
  readonly category = 'activity';
  readonly weight = 0.15;
  readonly requiredKeys = [SignalKeys.transfers30d, SignalKeys.uniqueSenders30d];

  evaluate({ signals }: EvaluationContext): Finding {
    const missing = signals.missing(this.requiredKeys);
    if (missing.length) return unknownFinding(this.category, this.weight, missing);

    const transfers = signals.get(SignalKeys.transfers30d) ?? 0;
    const senders = signals.get(SignalKeys.uniqueSenders30d) ?? 0;
    const score = 0.4 * logScore(transfers, 2_000) + 0.6 * logScore(senders, 500);
    const rationale = `${transfers} transfers from ${senders} distinct senders in the last 30 days`;
    return finding(this.category, this.weight, score, rationale, this.requiredKeys);
  }
}
