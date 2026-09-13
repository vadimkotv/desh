import { z } from 'zod';
import { evmAddress } from './startup.js';

// The Mandate is the human-authored investment policy an agent must obey.
// It is the only place a human expresses intent; every decision is bounded by it.
export const MandateSchema = z.object({
  thesis: z.string().min(10).max(1000),
  sectors: z.array(z.string()).min(1),
  minScore: z.number().min(0).max(100).default(60),
  maxTicketUsdc: z.number().positive(),
  maxPerRoundShareBps: z.number().int().min(1).max(10_000).default(2_000),
  dailyBudgetUsdc: z.number().positive(),
  maxDataSpendUsdc: z.number().nonnegative().default(1),
  riskTolerance: z.enum(['conservative', 'balanced', 'aggressive']).default('balanced'),
});
export type Mandate = z.infer<typeof MandateSchema>;

// How far an agent may act on its own conclusions. AUTONOMOUS settles USDC itself;
// ADVISORY does the same research and files a proposal a human has to approve.
export const AgentMode = z.enum(['AUTONOMOUS', 'ADVISORY']);
export type AgentMode = z.infer<typeof AgentMode>;

export const WalletKind = z.enum(['LOCAL_KEY', 'CIRCLE']);
export type WalletKind = z.infer<typeof WalletKind>;

export const AgentStatus = z.enum(['PAUSED', 'RUNNING']);
export type AgentStatus = z.infer<typeof AgentStatus>;

export const CreateAgentSchema = z.object({
  name: z.string().min(2).max(60),
  ownerAddress: evmAddress,
  walletKind: WalletKind.default('LOCAL_KEY'),
  mode: AgentMode.default('AUTONOMOUS'),
  ownerAccountId: z.string().uuid().optional(),
  mandate: MandateSchema,
});
export type CreateAgent = z.infer<typeof CreateAgentSchema>;

export const AgentSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  ownerAddress: z.string(),
  walletKind: WalletKind,
  walletAddress: z.string().nullable(),
  hederaAccountId: z.string().nullable(),
  erc8004AgentId: z.string().nullable(),
  erc8004ChainId: z.number().nullable(),
  status: AgentStatus,
  mode: AgentMode,
  ownerAccountId: z.string().nullable(),
  mandate: MandateSchema,
  createdAt: z.string(),
});
export type Agent = z.infer<typeof AgentSchema>;
