import type { RoundOnchainRef } from './round.repository';

export const ESCROW_ROUND_FACTORY = Symbol('ESCROW_ROUND_FACTORY');

export interface CreateEscrowRoundParams {
  founder: string;
  targetUsdc: number;
  deadline: Date;
  milestoneBps: number[];
  returnCapBps: number;
}

// Port implemented by the settlement module (Arc RoundEscrow). Startups depends on the
// abstraction only, so the chain adapter can be swapped or disabled.
export interface EscrowRoundFactory {
  createRound(params: CreateEscrowRoundParams): Promise<RoundOnchainRef>;
}
