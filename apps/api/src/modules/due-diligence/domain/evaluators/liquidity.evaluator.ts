import { type Finding, SignalKeys } from '@agentipo/shared';
import type { EvaluationContext, SignalEvaluator } from '../evaluator.port';
import { finding, fmtUsd, logScore, unknownFinding } from '../scoring';

// Secondary-market depth from the Messari standardized DEX schema.
export class LiquidityEvaluator implements SignalEvaluator {
  readonly category = 'liquidity';
  readonly weight = 0.15;
  readonly requiredKeys = [SignalKeys.dexLiquidityUsd, SignalKeys.dexVolume24hUsd];

  evaluate({ signals }: EvaluationContext): Finding {
    const missing = signals.missing(this.requiredKeys);
    if (missing.length) return unknownFinding(this.category, this.weight, missing);

    const tvl = signals.get(SignalKeys.dexLiquidityUsd) ?? 0;
    const vol = signals.get(SignalKeys.dexVolume24hUsd) ?? 0;
    const score = 0.6 * logScore(tvl, 5_000_000) + 0.4 * logScore(vol, 1_000_000);
    const rationale = `${fmtUsd(tvl)} DEX liquidity, ${fmtUsd(vol)} 24h volume across standardized DEX pools`;
    return finding(this.category, this.weight, score, rationale, this.requiredKeys);
  }
}
