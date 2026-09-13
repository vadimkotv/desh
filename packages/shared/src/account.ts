import { z } from 'zod';
import { evmAddress } from './startup.js';

// Which side of the marketplace someone is on. Null until they choose, which is the
// whole of onboarding: a founder lists a startup, an investor writes a mandate.
export const AccountRole = z.enum(['FOUNDER', 'INVESTOR']);
export type AccountRole = z.infer<typeof AccountRole>;

// What the client claims about itself. With Privy configured the access token is the
// only thing trusted and these fields are overwritten by its verified claims; without
// it, they are taken at face value so the whole flow still runs offline.
export const SessionRequestSchema = z.object({
  accessToken: z.string().optional(), // Privy access token, when Privy is configured
  privyDid: z.string().max(120).optional(),
  walletAddress: evmAddress.optional(),
  email: z.string().email().optional(),
});
export type SessionRequest = z.infer<typeof SessionRequestSchema>;

export const SetRoleSchema = z.object({ role: AccountRole });
export type SetRole = z.infer<typeof SetRoleSchema>;

export const AccountSchema = z.object({
  id: z.string(),
  privyDid: z.string(),
  role: AccountRole.nullable(),
  walletAddress: z.string().nullable(),
  email: z.string().nullable(),
  verified: z.boolean(), // true when a Privy token was actually verified
  createdAt: z.string(),
});
export type Account = z.infer<typeof AccountSchema>;

// Everything the dashboard needs to know about who is signed in and what they own.
export const SessionSchema = z.object({
  account: AccountSchema,
  startupIds: z.array(z.string()),
  agentIds: z.array(z.string()),
});
export type Session = z.infer<typeof SessionSchema>;
