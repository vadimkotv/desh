import { z } from 'zod';

// An agent asking a founder to open a gated part of the data room. The founder sees
// exactly whose agent is asking and on what mandate before deciding.
export const AccessStatus = z.enum(['PENDING', 'GRANTED', 'DENIED']);
export type AccessStatus = z.infer<typeof AccessStatus>;

export const RequestAccessSchema = z.object({
  agentId: z.string().uuid(),
  reason: z.string().max(500).default(''),
});
export type RequestAccess = z.infer<typeof RequestAccessSchema>;

export const AccessRequestSchema = z.object({
  id: z.string(),
  startupId: z.string(),
  startupName: z.string().nullable(),
  agentId: z.string(),
  agentName: z.string().nullable(),
  ownerAddress: z.string().nullable(),
  thesis: z.string().nullable(),
  status: AccessStatus,
  reason: z.string(),
  decidedAt: z.string().nullable(),
  createdAt: z.string(),
});
export type AccessRequest = z.infer<typeof AccessRequestSchema>;
