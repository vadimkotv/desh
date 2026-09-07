import type { Decision, DecisionVerdict } from '@agentipo/shared';

export const DECISION_REPOSITORY = Symbol('DECISION_REPOSITORY');

export interface NewDecision extends DecisionVerdict {
  agentId: string;
  roundId: string;
  reportId: string | null;
  engine: string;
  dataPaymentTxId: string | null;
}

export interface DecisionRepository {
  create(input: NewDecision): Promise<Decision>;
  findById(id: string): Promise<Decision | null>;
  listByAgent(agentId: string, limit?: number): Promise<Decision[]>;
  listAll(limit?: number): Promise<Decision[]>;
}
