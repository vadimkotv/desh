import { z } from 'zod';

// Revenue-share returns for a round: what has been distributed, what each investor may claim.
export const InvestorReturnSchema = z.object({
  agentId: z.string().nullable(),
  agentName: z.string().nullable(),
  address: z.string(),
  contributionUsdc: z.number(),
  claimableUsdc: z.number(),
  claimedUsdc: z.number(),
  expectedUsdc: z.number(), // contribution × cap
});
export type InvestorReturn = z.infer<typeof InvestorReturnSchema>;

export const RoundReturnsSchema = z.object({
  roundId: z.string(),
  onchainRoundId: z.number().nullable(),
  status: z.string(),
  returnCapBps: z.number(),
  raisedUsdc: z.number(),
  capUsdc: z.number(),
  distributedUsdc: z.number(),
  repaidShare: z.number(), // distributed / cap, 0..1
  investors: z.array(InvestorReturnSchema),
});
export type RoundReturns = z.infer<typeof RoundReturnsSchema>;

export const DistributeSchema = z.object({ amountUsdc: z.number().positive() });
export type Distribute = z.infer<typeof DistributeSchema>;

export const DistributionSchema = z.object({
  id: z.string(),
  roundId: z.string(),
  amountUsdc: z.number(),
  txHash: z.string().nullable(),
  source: z.string(),
  createdAt: z.string(),
});
export type Distribution = z.infer<typeof DistributionSchema>;

export const capMultiplier = (bps: number): string => `${(bps / 10_000).toFixed(2).replace(/\.?0+$/, '')}x`;
