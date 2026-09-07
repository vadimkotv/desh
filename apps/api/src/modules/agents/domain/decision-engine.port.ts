import type { DecisionVerdict, DueDiligenceReport, Mandate } from '@agentipo/shared';
import type { Agent0Reputation } from '../../data-room/infrastructure/graph-agent0/agent0.client';
import type { RoundDetail } from '../../startups/domain/round.repository';

export const DECISION_ENGINES = Symbol('DECISION_ENGINES');

export interface DecisionInput {
  mandate: Mandate;
  round: RoundDetail;
  report: DueDiligenceReport;
  maxAmountUsdc: number; // hard ceiling already derived from the spending policy
  selfReputation: Agent0Reputation | null; // the agent's own ERC-8004 reputation
}

// Strategy port: an LLM engine and a deterministic rules engine are interchangeable.
export interface DecisionEngine {
  readonly name: string;
  available(): boolean;
  decide(input: DecisionInput): Promise<DecisionVerdict>;
}
