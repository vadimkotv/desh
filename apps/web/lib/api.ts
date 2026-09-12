import type * as S from '@agentipo/shared';
import type * as T from './api-types';

// Single fetch call site for the dashboard. Works in server components and
// client components alike; every helper returns an ApiResult, never throws.
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

function errorMessage(body: string, fallback: string): string {
  try {
    const parsed: unknown = JSON.parse(body);
    if (parsed && typeof parsed === 'object') {
      // Contract reverts arrive as 409 { error: 'ContractRevert', reason, message } — the reason is the useful bit.
      const { reason, message } = parsed as { reason?: unknown; message?: unknown };
      if (typeof reason === 'string' && reason) return reason;
      if (message !== undefined)
        return Array.isArray(message) ? message.join(', ') : String(message);
    }
  } catch {
    // not JSON — fall through to raw text
  }
  return body || fallback;
}

async function request<R>(path: string, init?: RequestInit): Promise<T.ApiResult<R>> {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      cache: 'no-store',
      ...init,
      headers: { accept: 'application/json', 'content-type': 'application/json', ...init?.headers },
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      return { ok: false, status: res.status, error: errorMessage(body, res.statusText) };
    }
    const text = await res.text();
    return { ok: true, data: (text ? JSON.parse(text) : null) as R };
  } catch (err) {
    return { ok: false, status: 0, error: err instanceof Error ? err.message : 'network error' };
  }
}

const get = <R>(path: string) => request<R>(path);
const post = <R>(path: string, body?: unknown) =>
  request<R>(path, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) });

export const api = {
  health: () => get<T.Health>('/health'),
  stats: () => get<S.Stats>('/stats'),
  rounds: () => get<T.RoundDetail[]>('/rounds'),
  round: (id: string) => get<T.RoundDetail>(`/rounds/${id}`),
  roundReturns: (id: string) => get<S.RoundReturns>(`/rounds/${id}/returns`),
  distributions: (id: string) => get<S.Distribution[]>(`/rounds/${id}/distributions`),
  ddPreview: (roundId: string) => get<S.DueDiligencePreview>(`/due-diligence/rounds/${roundId}`),
  ddReport: (roundId: string) =>
    get<S.DueDiligenceReport>(`/due-diligence/rounds/${roundId}/report`),
  ddHistory: (roundId: string) =>
    get<T.DdHistoryPoint[]>(`/due-diligence/rounds/${roundId}/history`),
  signals: (startupId: string) => get<S.Signal[]>(`/data-room/startups/${startupId}/signals`),
  agents: () => get<S.Agent[]>('/agents'),
  agent: (id: string) => get<S.Agent>(`/agents/${id}`),
  agentDecisions: (id: string) => get<S.Decision[]>(`/agents/${id}/decisions`),
  decisions: () => get<S.Decision[]>('/decisions'),
  audit: () => get<S.AuditEntry[]>('/audit'),
  runs: (limit = 8) => get<S.RunEvent[][]>(`/runs?limit=${limit}`),
  receipts: () => get<T.Receipt[]>('/payments/receipts'),
  pricing: () => get<T.Pricing>('/payments/pricing'),
  walletUsdc: (address: string) => get<T.WalletBalance>(`/settlement/wallets/${address}/usdc`),
  onchainRound: (onchainId: number) => get<T.OnchainRound>(`/settlement/rounds/${onchainId}`),
  createAgent: (input: S.CreateAgent) => post<S.Agent>('/agents', input),
  registerIdentity: (id: string) => post<S.Agent>(`/agents/${id}/identity`),
  runAgent: (id: string) => post<S.Agent>(`/agents/${id}/run`),
  pauseAgent: (id: string) => post<S.Agent>(`/agents/${id}/pause`),
  startRun: (agentId: string, roundId?: string) =>
    post<T.RunHandle>(`/agents/${agentId}/runs${roundId ? `?roundId=${roundId}` : ''}`),
  swarm: (roundId: string) => post<T.SwarmResponse>(`/rounds/${roundId}/swarm`),
  claim: (agentId: string, roundId: string) =>
    post<T.ClaimResult>(`/agents/${agentId}/claim?roundId=${roundId}`),
  finalizeRound: (id: string) => post<T.RoundDetail>(`/rounds/${id}/finalize`),
  releaseMilestone: (id: string) => post<T.RoundDetail>(`/rounds/${id}/milestones/release`),
  distribute: (id: string, amountUsdc: number) =>
    post<T.RoundDetail>(`/rounds/${id}/distribute`, { amountUsdc }),
  syncRound: (id: string) => post<T.RoundDetail>(`/rounds/${id}/sync`),
  refreshDataRoom: (startupId: string) => post<unknown>(`/data-room/startups/${startupId}/refresh`),
  generateReport: (roundId: string) =>
    post<S.DueDiligenceReport>(`/due-diligence/rounds/${roundId}/generate`),
};

// SSE endpoints are consumed by EventSource, not fetch; the URLs still come from here.
export const sseUrl = {
  firehose: () => `${API_URL}/events`,
  run: (runId: string) => `${API_URL}/runs/${runId}/events`,
};

// Collapses a list result into data-or-empty while remembering whether the API
// was reachable, so pages can render an "offline" state instead of crashing.
export function listOrEmpty<R>(result: T.ApiResult<R[]>): { items: R[]; offline: boolean } {
  if (result.ok) return { items: Array.isArray(result.data) ? result.data : [], offline: false };
  return { items: [], offline: result.status === 0 };
}
