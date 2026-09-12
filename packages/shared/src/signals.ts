import { z } from 'zod';

// A Signal is one normalized fact about a startup, produced by a data provider.
// Every provider (Graph Token API, Messari subgraph, Agent0 subgraph, GitHub...)
// emits the same shape, so evaluators never need to know where data came from.
export const SignalSource = z.enum([
  'graph-token-api',
  'graph-messari-dex',
  'graph-agent0',
  'onchain-arc',
  'founder-metrics',
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
  // Founder-published metrics, read as trajectories. A level without a slope is not
  // an investment case, so the growth keys are what the evaluator actually scores.
  mrrUsd: 'founder.revenue.mrr.usd',
  mrrPerMonthUsd: 'founder.revenue.mrr.perMonthUsd',
  mrrGrowthBps: 'founder.revenue.mrr.growthBps',
  activeUsers: 'founder.users.active.count',
  activeUsersPerMonth: 'founder.users.active.perMonth',
  activeUsersGrowthBps: 'founder.users.active.growthBps',
  metricsSpanDays: 'founder.metrics.spanDays',
} as const;

// The founder metric keys the growth evaluator knows how to read.
export const GROWTH_METRIC_KEYS = {
  'revenue.mrr.usd': { latest: 'founder.revenue.mrr.usd', perMonth: 'founder.revenue.mrr.perMonthUsd', growth: 'founder.revenue.mrr.growthBps' },
  'users.active.count': { latest: 'founder.users.active.count', perMonth: 'founder.users.active.perMonth', growth: 'founder.users.active.growthBps' },
} as const;
