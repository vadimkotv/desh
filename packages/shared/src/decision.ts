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
  investment: InvestmentSchema.nullable(),
  createdAt: z.string(),
});
export type Decision = z.infer<typeof DecisionSchema>;
