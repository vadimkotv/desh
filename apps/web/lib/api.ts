import type {
  Agent,
  AuditEntry,
  CreateAgent,
  Decision,
  DueDiligencePreview,
  Signal,
} from '@agentipo/shared';
import type { ApiResult, RoundDetail } from './types';

// Single fetch call site for the dashboard. Works in server components and
// client components alike; every helper returns an ApiResult, never throws.
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

function errorMessage(body: string, fallback: string): string {
  try {
    const parsed: unknown = JSON.parse(body);
    if (parsed && typeof parsed === 'object' && 'message' in parsed) {
      const message = (parsed as { message: unknown }).message;
      return Array.isArray(message) ? message.join(', ') : String(message);
    }
  } catch {
    // not JSON — fall through to raw text
  }
  return body || fallback;
}

async function request<T>(path: string, init?: RequestInit): Promise<ApiResult<T>> {
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
    return { ok: true, data: (text ? JSON.parse(text) : null) as T };
  } catch (err) {
    return { ok: false, status: 0, error: err instanceof Error ? err.message : 'network error' };
  }
}

const get = <T>(path: string) => request<T>(path);
const post = <T>(path: string, body?: unknown) =>
  request<T>(path, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) });

export const api = {
  rounds: () => get<RoundDetail[]>('/rounds'),
  round: (id: string) => get<RoundDetail>(`/rounds/${id}`),
  ddPreview: (roundId: string) => get<DueDiligencePreview>(`/due-diligence/rounds/${roundId}`),
  signals: (startupId: string) => get<Signal[]>(`/data-room/startups/${startupId}/signals`),
  agents: () => get<Agent[]>('/agents'),
  agent: (id: string) => get<Agent>(`/agents/${id}`),
  agentDecisions: (id: string) => get<Decision[]>(`/agents/${id}/decisions`),
  decisions: () => get<Decision[]>('/decisions'),
  audit: () => get<AuditEntry[]>('/audit'),
  createAgent: (input: CreateAgent) => post<Agent>('/agents', input),
  runAgent: (id: string) => post<Decision[]>(`/agents/${id}/run`),
  refreshDataRoom: (startupId: string) =>
    post<unknown>(`/data-room/startups/${startupId}/refresh`),
  generateReport: (roundId: string) =>
    post<DueDiligencePreview>(`/due-diligence/rounds/${roundId}/generate`),
};

// Collapses a list result into data-or-empty while remembering whether the API
// was reachable, so pages can render an "offline" state instead of crashing.
export function listOrEmpty<T>(result: ApiResult<T[]>): { items: T[]; offline: boolean } {
  if (result.ok) return { items: Array.isArray(result.data) ? result.data : [], offline: false };
  return { items: [], offline: result.status === 0 };
}
