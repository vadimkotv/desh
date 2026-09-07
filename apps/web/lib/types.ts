import type { Investment, Round, Startup } from '@agentipo/shared';

// The API's GET /rounds and GET /rounds/:id embed the startup and the round's
// investments (ARCHITECTURE.md §5). The shared RoundSchema only marks startup as
// optional, so the web app narrows the shape once here.
export type RoundDetail = Round & {
  startup: Startup;
  investments: Investment[];
};

export type ApiResult<T> = { ok: true; data: T } | { ok: false; status: number; error: string };

export const isOffline = (result: ApiResult<unknown>): boolean => !result.ok && result.status === 0;
