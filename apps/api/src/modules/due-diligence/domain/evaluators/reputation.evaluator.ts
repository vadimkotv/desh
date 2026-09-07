import { type Finding, SignalKeys } from '@agentipo/shared';
import type { EvaluationContext, SignalEvaluator } from '../evaluator.port';
import { finding, logScore, unknownFinding } from '../scoring';

// Founder track record on the ERC-8004 trust layer (Agent0 subgraph).
export class ReputationEvaluator implements SignalEvaluator {
  readonly category = 'reputation';
  readonly weight = 0.1;
  readonly requiredKeys = [SignalKeys.founderAgentReputation, SignalKeys.founderAgentFeedbackCount];

  evaluate({ signals }: EvaluationContext): Finding {
    const missing = signals.missing(this.requiredKeys);
    if (missing.length) return unknownFinding(this.category, this.weight, missing);

    const avg = signals.get(SignalKeys.founderAgentReputation) ?? 0;
    const count = signals.get(SignalKeys.founderAgentFeedbackCount) ?? 0;
    if (count === 0) {
      return finding(this.category, this.weight, 35, 'Founder has no ERC-8004 agent feedback on record', this.requiredKeys);
    }
    const confidence = logScore(count, 50) / 100;
    const score = avg * confidence + 50 * (1 - confidence);
    const rationale = `Founder-operated agents average ${avg.toFixed(0)}/100 over ${count} feedback entries`;
    return finding(this.category, this.weight, score, rationale, this.requiredKeys);
  }
}
