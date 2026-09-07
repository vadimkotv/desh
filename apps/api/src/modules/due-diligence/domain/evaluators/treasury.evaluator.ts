import { type Finding, SignalKeys } from '@agentipo/shared';
import type { EvaluationContext, SignalEvaluator } from '../evaluator.port';
import { clamp, finding, fmtUsd, ratioScore, unknownFinding } from '../scoring';

// Can the team survive without this round? Stablecoin reserves relative to the ask,
// penalised when the treasury is mostly the startup's own token.
export class TreasuryEvaluator implements SignalEvaluator {
  readonly category = 'treasury';
  readonly weight = 0.2;
  readonly requiredKeys = [SignalKeys.treasuryStableUsd, SignalKeys.treasuryOwnTokenShareBps];

  evaluate({ signals, round }: EvaluationContext): Finding {
    const missing = signals.missing(this.requiredKeys);
    if (missing.length) return unknownFinding(this.category, this.weight, missing);

    const stables = signals.get(SignalKeys.treasuryStableUsd) ?? 0;
    const ownShare = (signals.get(SignalKeys.treasuryOwnTokenShareBps) ?? 0) / 100;
    const reserves = ratioScore(stables, round.targetUsdc * 0.5);
    const selfPenalty = clamp((ownShare - 70) * 2, 0, 40);
    const score = clamp(reserves - selfPenalty);
    const rationale = `${fmtUsd(stables)} in stablecoins vs ${fmtUsd(round.targetUsdc)} ask; own token is ${ownShare.toFixed(0)}% of treasury`;
    return finding(this.category, this.weight, score, rationale, this.requiredKeys);
  }
}
