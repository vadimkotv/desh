export const ESCROW_OPERATOR = Symbol('ESCROW_OPERATOR');

// Platform-signed lifecycle actions on the escrow. Null when Arc is not configured.
export interface EscrowOperator {
  finalize(onchainRoundId: number): Promise<string>;
  releaseMilestone(onchainRoundId: number): Promise<string>;
  // Pushes revenue into the round's return pool (the platform wallet acts as the revenue router).
  distribute(onchainRoundId: number, amountUsdc: number): Promise<string>;
}
