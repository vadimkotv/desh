import type { ApprovalState, Decision, DecisionVerdict } from '@agentipo/shared';

export const DECISION_REPOSITORY = Symbol('DECISION_REPOSITORY');

export interface NewDecision extends DecisionVerdict {
  agentId: string;
  roundId: string;
  reportId: string | null;
  engine: string;
  dataPaymentTxId: string | null;
  approval: ApprovalState;
}

export interface DecisionRepository {
  create(input: NewDecision): Promise<Decision>;
  findById(id: string): Promise<Decision | null>;
  listByAgent(agentId: string, limit?: number): Promise<Decision[]>;
  listAll(limit?: number): Promise<Decision[]>;
  listPending(): Promise<Decision[]>;
  resolve(id: string, approval: ApprovalState, approvedBy: string): Promise<Decision>;
}
