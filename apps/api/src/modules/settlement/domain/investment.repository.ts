import type { Investment, InvestmentStatus } from '@agentipo/shared';

export const INVESTMENT_REPOSITORY = Symbol('INVESTMENT_REPOSITORY');

export interface NewInvestment {
  decisionId: string;
  roundId: string;
  agentId: string;
  amountUsdc: number;
  chainId: number;
}

export interface InvestmentRepository {
  create(input: NewInvestment): Promise<Investment>;
  setSubmitted(id: string, txHash: string): Promise<void>;
  setStatus(id: string, status: InvestmentStatus, error?: string): Promise<void>;
  spentSince(agentId: string, since: Date): Promise<number>;
}
