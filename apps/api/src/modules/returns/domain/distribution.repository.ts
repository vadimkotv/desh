import type { Distribution } from '@agentipo/shared';

export const DISTRIBUTION_REPOSITORY = Symbol('DISTRIBUTION_REPOSITORY');

export interface NewDistribution {
  roundId: string;
  amountUsdc: number;
  txHash: string | null;
  source: string;
}

export interface DistributionRepository {
  create(input: NewDistribution): Promise<Distribution>;
  listByRound(roundId: string): Promise<Distribution[]>;
}
