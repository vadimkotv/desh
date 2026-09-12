import type { ExitKind } from '@agentipo/shared';

export const ESCROW_OPERATOR = Symbol('ESCROW_OPERATOR');

// A liquidity event settled into a round: what happened, at what valuation, and
// how much USDC it pays the round's investors.
export interface ExitSettlement {
  kind: ExitKind;
  valuationUsdc: number;
  proceedsUsdc: number;
  evidenceUri: string;
}

// Platform-signed lifecycle actions on the escrow. Null when Arc is not configured.
export interface EscrowOperator {
  finalize(onchainRoundId: number): Promise<string>;
  releaseMilestone(onchainRoundId: number): Promise<string>;
  // Pays exit proceeds into the round's claim pool (the platform wallet acts as the settler).
  settleExit(onchainRoundId: number, exit: ExitSettlement): Promise<string>;
}
