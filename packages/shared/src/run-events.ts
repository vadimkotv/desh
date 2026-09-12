import { z } from 'zod';

// Live events emitted while an agent run executes. Streamed over SSE so the dashboard
// can animate the pipeline step by step instead of waiting for the final decision.
export const RunEventType = z.enum([
  // Lifecycle notices: an agent going RUNNING or PAUSED. Firehose-only, not part of a run.
  'agent.started',
  'agent.paused',
  'run.started',
  'round.discovered',
  'data.purchasing',
  'data.purchased',
  'gate.passed',
  'gate.failed',
  'policy.evaluated',
  'engine.deciding',
  'engine.decided',
  'approval.requested',
  'settlement.submitted',
  'settlement.confirmed',
  'settlement.failed',
  'round.done',
  'round.failed',
  'run.completed',
]);
export type RunEventType = z.infer<typeof RunEventType>;

export const RunEventSchema = z.object({
  id: z.number().int(),
  runId: z.string(),
  agentId: z.string(),
  roundId: z.string().nullable(),
  type: RunEventType,
  at: z.string(),
  payload: z.record(z.unknown()),
});
export type RunEvent = z.infer<typeof RunEventSchema>;

// True for the firehose-only lifecycle notices above, which carry no run of their own.
export const isAgentLifecycle = (type: RunEventType): boolean => type.startsWith('agent.');

export const PIPELINE_STEPS = [
  { key: 'data', label: 'Buy data (x402)', start: 'data.purchasing', done: ['data.purchased'] },
  { key: 'gate', label: 'Mandate gate', start: 'data.purchased', done: ['gate.passed', 'gate.failed'] },
  { key: 'policy', label: 'Spending policy', start: 'gate.passed', done: ['policy.evaluated'] },
  { key: 'engine', label: 'Decision engine', start: 'engine.deciding', done: ['engine.decided'] },
  { key: 'settle', label: 'Settle on Arc', start: 'settlement.submitted', done: ['settlement.confirmed', 'settlement.failed'] },
] as const;

export const StatsSchema = z.object({
  openRounds: z.number(),
  totalRounds: z.number(),
  raisedUsdc: z.number(),
  targetUsdc: z.number(),
  agents: z.number(),
  decisions: z.number(),
  investments: z.number(),
  investedUsdc: z.number(),
  dataPurchases: z.number(),
  proceedsUsdc: z.number(),
  claimedUsdc: z.number(),
  auditEntries: z.number(),
  hcsAnchored: z.number(),
});
export type Stats = z.infer<typeof StatsSchema>;
