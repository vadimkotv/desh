import type { CreateRound, Investment, Round, RoundStatus, Startup } from '@agentipo/shared';

export const ROUND_REPOSITORY = Symbol('ROUND_REPOSITORY');

export type RoundDetail = Round & { startup: Startup; investments: Investment[] };

export interface RoundOnchainRef {
  onchainRoundId: number;
  escrowAddress: string;
}

// What a chain read tells us about a round; the DB never invents these.
export interface RoundOnchainState {
  status: RoundStatus;
  raisedUsdc: number;
  releasedUsdc: number;
  proceedsUsdc: number;
}

export interface RoundRepository {
  create(input: CreateRound, onchain?: RoundOnchainRef): Promise<RoundDetail>;
  findById(id: string): Promise<RoundDetail | null>;
  findAll(status?: RoundStatus): Promise<RoundDetail[]>;
  findOpenBySectors(sectors: string[]): Promise<RoundDetail[]>;
  findOpenUndecidedByAgent(sectors: string[], agentId: string): Promise<RoundDetail[]>;
  addRaised(id: string, amountUsdc: number): Promise<void>;
  setStatus(id: string, status: RoundStatus): Promise<void>;
  syncOnchain(id: string, state: RoundOnchainState): Promise<void>;
}
