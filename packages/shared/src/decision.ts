import { z } from 'zod';

export const DecisionAction = z.enum(['INVEST', 'PASS', 'WATCH']);
export type DecisionAction = z.infer<typeof DecisionAction>;

// The structured verdict a DecisionEngine must return. Keeping it strict means
// an LLM engine and a rules engine are interchangeable behind the same port.
export const DecisionVerdictSchema = z.object({
  action: DecisionAction,
  amountUsdc: z.number().nonnegative(),
  confidence: z.number().min(0).max(1),
  reasoning: z.string().min(1).max(4000),
  keyRisks: z.array(z.string()).max(10),
});
export type DecisionVerdict = z.infer<typeof DecisionVerdictSchema>;

// Whether a human still has to sign off before money moves. An AUTONOMOUS agent's
// decisions are NOT_REQUIRED; an ADVISORY agent's INVEST decisions land as PENDING.
export const ApprovalState = z.enum(['NOT_REQUIRED', 'PENDING', 'APPROVED', 'REJECTED']);
export type ApprovalState = z.infer<typeof ApprovalState>;

export const InvestmentStatus = z.enum(['PENDING', 'CONFIRMED', 'FAILED']);
export type InvestmentStatus = z.infer<typeof InvestmentStatus>;

export const InvestmentSchema = z.object({
  id: z.string().uuid(),
  roundId: z.string().uuid(),
  agentId: z.string().uuid(),
  amountUsdc: z.number(),
  chainId: z.number(),
  txHash: z.string().nullable(),
  status: InvestmentStatus,
  error: z.string().nullable(),
  claimedUsdc: z.number().default(0),
  createdAt: z.string(),
});
export type Investment = z.infer<typeof InvestmentSchema>;

export const DecisionSchema = DecisionVerdictSchema.extend({
  id: z.string().uuid(),
  agentId: z.string().uuid(),
  roundId: z.string().uuid(),
  reportId: z.string().uuid().nullable(),
  engine: z.string(),
  dataPaymentTxId: z.string().nullable(),
  approval: ApprovalState,
  approvedBy: z.string().nullable(),
  decidedAt: z.string().nullable(), // when a human approved or rejected it
  investment: InvestmentSchema.nullable(),
  createdAt: z.string(),
});
export type Decision = z.infer<typeof DecisionSchema>;

export const ApproveDecisionSchema = z.object({
  approvedBy: z.string().min(1).max(120).default('operator'),
});
export type ApproveDecision = z.infer<typeof ApproveDecisionSchema>;
