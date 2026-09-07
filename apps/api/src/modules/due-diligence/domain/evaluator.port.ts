import type { Finding, Round } from '@agentipo/shared';
import type { SignalMap } from './signal-map';

export const SIGNAL_EVALUATORS = Symbol('SIGNAL_EVALUATORS');

export interface EvaluationContext {
  signals: SignalMap;
  round: Pick<Round, 'targetUsdc' | 'raisedUsdc' | 'deadline'>;
}

// One evaluator = one due-diligence category. Pure, deterministic, unit-testable.
export interface SignalEvaluator {
  readonly category: string;
  readonly weight: number;
  readonly requiredKeys: string[];
  evaluate(ctx: EvaluationContext): Finding;
}
