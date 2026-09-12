import { z } from 'zod';

// Every consequential agent action is written to a Hedera Consensus Service topic
// so third parties can audit "why did this agent invest" without trusting our DB.
export const AuditKind = z.enum([
  'AGENT_REGISTERED',
  'DATA_PURCHASED',
  'DECISION_MADE',
  'INVESTMENT_SUBMITTED',
  'INVESTMENT_CONFIRMED',
  'INVESTMENT_FAILED',
  'ROUND_FINALIZED',
  'MILESTONE_RELEASED',
  'EXIT_SETTLED',
  'RETURN_CLAIMED',
]);
export type AuditKind = z.infer<typeof AuditKind>;

export const AuditEntrySchema = z.object({
  id: z.string().uuid(),
  agentId: z.string().uuid().nullable(),
  kind: AuditKind,
  payload: z.record(z.unknown()),
  hcsTopicId: z.string().nullable(),
  hcsSequenceNumber: z.number().nullable(),
  createdAt: z.string(),
});
export type AuditEntry = z.infer<typeof AuditEntrySchema>;
