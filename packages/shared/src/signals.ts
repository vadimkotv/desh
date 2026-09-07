import { z } from 'zod';

// A Signal is one normalized fact about a startup, produced by a data provider.
// Every provider (Graph Token API, Messari subgraph, Agent0 subgraph, GitHub...)
// emits the same shape, so evaluators never need to know where data came from.
export const SignalSource = z.enum([
  'graph-token-api',
  'graph-messari-dex',
  'graph-agent0',
  'onchain-arc',
  'github',
  'demo-fixture',
]);
export type SignalSource = z.infer<typeof SignalSource>;

export const SignalSchema = z.object({
  key: z.string(), // e.g. "token.holders.count"
  value: z.number(),
  unit: z.string().optional(), // "count", "usd", "bps", "days"
  source: SignalSource,
  observedAt: z.string(),
  meta: z.record(z.unknown()).optional(),
});
export type Signal = z.infer<typeof SignalSchema>;

export const SignalKeys = {
  holdersCount: 'token.holders.count',
  topTenConcentrationBps: 'token.holders.top10ConcentrationBps',
  transfers30d: 'token.transfers.count30d',
  uniqueSenders30d: 'token.transfers.uniqueSenders30d',
  treasuryStableUsd: 'treasury.stable.usd',
  treasuryTokenCount: 'treasury.tokens.count',
  treasuryOwnTokenShareBps: 'treasury.ownTokenShareBps',
  dexLiquidityUsd: 'dex.liquidity.usd',
  dexVolume24hUsd: 'dex.volume24h.usd',
  founderAgentReputation: 'founder.agent.reputationAvg',
  founderAgentFeedbackCount: 'founder.agent.feedbackCount',
  escrowRaisedUsdc: 'escrow.raised.usdc',
  escrowInvestorCount: 'escrow.investors.count',
} as const;
