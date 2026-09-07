import { z } from 'zod';

export const evmAddress = z.string().regex(/^0x[0-9a-fA-F]{40}$/, 'invalid EVM address');

export const RoundStatus = z.enum(['OPEN', 'FUNDED', 'FAILED', 'CLOSED']);
export type RoundStatus = z.infer<typeof RoundStatus>;

export const MilestoneSchema = z.object({
  title: z.string().min(1),
  releaseBps: z.number().int().min(1).max(10_000),
});
export type Milestone = z.infer<typeof MilestoneSchema>;

export const CreateStartupSchema = z.object({
  name: z.string().min(2).max(80),
  description: z.string().min(10).max(2000),
  sector: z.string().min(2).max(40),
  website: z.string().url().optional(),
  founderAddress: evmAddress,
  treasuryAddress: evmAddress,
  tokenAddress: evmAddress.optional(),
  tokenNetwork: z.string().default('mainnet'),
  githubRepo: z.string().optional(),
});
export type CreateStartup = z.infer<typeof CreateStartupSchema>;

export const CreateRoundSchema = z.object({
  startupId: z.string().uuid(),
  targetUsdc: z.number().positive(),
  minTicketUsdc: z.number().positive().default(10),
  deadline: z.string().datetime(),
  milestones: z.array(MilestoneSchema).min(1),
});
export type CreateRound = z.infer<typeof CreateRoundSchema>;

export const StartupSchema = CreateStartupSchema.extend({
  id: z.string().uuid(),
  createdAt: z.string(),
});
export type Startup = z.infer<typeof StartupSchema>;

export const RoundSchema = z.object({
  id: z.string().uuid(),
  startupId: z.string().uuid(),
  onchainRoundId: z.number().int().nullable(),
  escrowAddress: z.string().nullable(),
  targetUsdc: z.number(),
  raisedUsdc: z.number(),
  minTicketUsdc: z.number(),
  deadline: z.string(),
  status: RoundStatus,
  milestones: z.array(MilestoneSchema),
  startup: StartupSchema.optional(),
});
export type Round = z.infer<typeof RoundSchema>;
