import { z } from 'zod';

export const evmAddress = z.string().regex(/^0x[0-9a-fA-F]{40}$/, 'invalid EVM address');

export const RoundStatus = z.enum(['OPEN', 'FUNDED', 'FAILED', 'CLOSED', 'EXITED']);
export type RoundStatus = z.infer<typeof RoundStatus>;

export const MilestoneSchema = z.object({
  title: z.string().min(1),
  releaseBps: z.number().int().min(1).max(10_000),
});
export type Milestone = z.infer<typeof MilestoneSchema>;

// Public presence of a startup. `kind` drives the icon; anything unrecognised is `other`.
export const LinkKind = z.enum([
  'website',
  'twitter',
  'github',
  'docs',
  'discord',
  'telegram',
  'linkedin',
  'farcaster',
  'explorer',
  'other',
]);
export type LinkKind = z.infer<typeof LinkKind>;

export const StartupLinkSchema = z.object({
  kind: LinkKind,
  url: z.string().url(),
  label: z.string().max(40).optional(),
});
export type StartupLink = z.infer<typeof StartupLinkSchema>;

export const CreateStartupSchema = z.object({
  name: z.string().min(2).max(80),
  description: z.string().min(10).max(2000),
  sector: z.string().min(2).max(40),
  logoUrl: z.string().url().optional(),
  website: z.string().url().optional(),
  founderAddress: evmAddress,
  treasuryAddress: evmAddress,
  tokenAddress: evmAddress.optional(),
  tokenNetwork: z.string().default('mainnet'),
  githubRepo: z.string().optional(),
  links: z.array(StartupLinkSchema).max(12).default([]),
  ownerAccountId: z.string().uuid().optional(),
});
export type CreateStartup = z.infer<typeof CreateStartupSchema>;

export const CreateRoundSchema = z.object({
  startupId: z.string().uuid(),
  targetUsdc: z.number().positive(),
  minTicketUsdc: z.number().positive().default(10),
  deadline: z.string().datetime(),
  milestones: z.array(MilestoneSchema).min(1),
  // Stake sold by the round, in bps. It fixes the entry valuation (raised × 10000 / equityBps)
  // and the share of exit proceeds investors receive when the startup exits.
  equityBps: z.number().int().min(10).max(5_000).default(800),
});
export type CreateRound = z.infer<typeof CreateRoundSchema>;

export const StartupSchema = CreateStartupSchema.extend({
  id: z.string().uuid(),
  ownerAccountId: z.string().nullable(),
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
  equityBps: z.number().int(),
  releasedUsdc: z.number(),
  proceedsUsdc: z.number(),
  startup: StartupSchema.optional(),
});
export type Round = z.infer<typeof RoundSchema>;

// Valuation the round is priced at. 0 before anything is raised.
export const entryValuation = (raisedUsdc: number, equityBps: number): number =>
  equityBps > 0 ? (raisedUsdc * 10_000) / equityBps : 0;
