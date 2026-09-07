export const ESCROW_READER = Symbol('ESCROW_READER');

export type OnchainRoundStatus = 'Open' | 'Funded' | 'Failed' | 'Closed' | 'Repaid';

export interface OnchainRound {
  onchainRoundId: number;
  escrowAddress: string;
  founder: string;
  targetUsdc: number;
  raisedUsdc: number;
  deadline: Date;
  status: OnchainRoundStatus;
  releasedCount: number;
  investorCount: number;
  milestoneBps: number[];
  returnCapBps: number;
  capUsdc: number;
  distributedUsdc: number;
}

export interface InvestorPosition {
  contributionUsdc: number;
  claimableUsdc: number;
  claimedUsdc: number;
}

export interface EscrowReader {
  getRound(onchainRoundId: number): Promise<OnchainRound>;
  contributionOf(onchainRoundId: number, investor: string): Promise<number>;
  positionOf(onchainRoundId: number, investor: string): Promise<InvestorPosition>;
}
