import { z } from 'zod';

// Capital comes back only on a liquidity event. There is no revenue share and no cap:
// whatever the exit pays is split pro-rata among the round's investors.
export const ExitKind = z.enum(['ACQUISITION', 'IPO', 'TGE', 'CONTRACT']);
export type ExitKind = z.infer<typeof ExitKind>;

export const EXIT_LABELS: Record<ExitKind, string> = {
  ACQUISITION: 'Acquisition',
  IPO: 'IPO',
  TGE: 'Token generation event',
  CONTRACT: 'Contract payout',
};

export const InvestorReturnSchema = z.object({
  agentId: z.string().nullable(),
  agentName: z.string().nullable(),
  address: z.string(),
  contributionUsdc: z.number(),
  claimableUsdc: z.number(),
  claimedUsdc: z.number(),
  proRataUsdc: z.number(), // share of everything settled so far
  multiple: z.number(), // proRata / contribution
});
export type InvestorReturn = z.infer<typeof InvestorReturnSchema>;

export const RoundReturnsSchema = z.object({
  roundId: z.string(),
  onchainRoundId: z.number().nullable(),
  status: z.string(),
  equityBps: z.number(),
  raisedUsdc: z.number(),
  entryValuationUsdc: z.number(),
  proceedsUsdc: z.number(),
  multiple: z.number(), // proceeds / raised, 0 until an exit is settled
  investors: z.array(InvestorReturnSchema),
});
export type RoundReturns = z.infer<typeof RoundReturnsSchema>;

export const SettleExitSchema = z.object({
  kind: ExitKind,
  valuationUsdc: z.number().nonnegative().default(0),
  proceedsUsdc: z.number().positive(),
  evidenceUri: z.string().max(200).default(''),
});
export type SettleExit = z.infer<typeof SettleExitSchema>;

export const ExitEventSchema = z.object({
  id: z.string(),
  roundId: z.string(),
  kind: ExitKind,
  valuationUsdc: z.number(),
  proceedsUsdc: z.number(),
  evidenceUri: z.string(),
  txHash: z.string().nullable(),
  createdAt: z.string(),
});
export type ExitEvent = z.infer<typeof ExitEventSchema>;

// "3.4x" — trailing zeros trimmed. Returns "—" before anything is settled.
export const formatMultiple = (value: number): string =>
  value > 0 ? `${value.toFixed(2).replace(/\.?0+$/, '')}x` : '—';
