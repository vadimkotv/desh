import { type Finding, SignalKeys } from '@agentipo/shared';
import type { EvaluationContext, SignalEvaluator } from '../evaluator.port';
import { finding, fmtUsd, logScore, ratioScore, unknownFinding } from '../scoring';

// Round momentum read straight from the Arc escrow: how much is committed and by how many.
export class TractionEvaluator implements SignalEvaluator {
  readonly category = 'traction';
  readonly weight = 0.2;
  readonly requiredKeys = [SignalKeys.escrowRaisedUsdc, SignalKeys.escrowInvestorCount];

  evaluate({ signals, round }: EvaluationContext): Finding {
    const missing = signals.missing(this.requiredKeys);
    if (missing.length) return unknownFinding(this.category, this.weight, missing);

    const raised = signals.get(SignalKeys.escrowRaisedUsdc) ?? 0;
    const investors = signals.get(SignalKeys.escrowInvestorCount) ?? 0;
    const score = 0.6 * ratioScore(raised, round.targetUsdc) + 0.4 * logScore(investors, 50);
    const pct = round.targetUsdc > 0 ? ((raised / round.targetUsdc) * 100).toFixed(0) : '0';
    const rationale = `${fmtUsd(raised)} committed on-chain (${pct}% of target) by ${investors} investors`;
    return finding(this.category, this.weight, score, rationale, this.requiredKeys);
  }
}
