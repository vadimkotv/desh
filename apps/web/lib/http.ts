import type { ApiResult } from './api-types';

// Single fetch call site for the dashboard. Works in server components and client
// components alike; every helper returns an ApiResult, never throws.
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

export async function request<R>(path: string, init?: RequestInit): Promise<ApiResult<R>> {
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

export const get = <R>(path: string) => request<R>(path);
export const post = <R>(path: string, body?: unknown) =>
  request<R>(path, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) });

// SSE endpoints are consumed by EventSource, not fetch; the URLs still come from here.
export const sseUrl = {
  firehose: () => `${API_URL}/events`,
  run: (runId: string) => `${API_URL}/runs/${runId}/events`,
};

// Collapses a list result into data-or-empty while remembering whether the API was
// reachable, so pages can render an "offline" state instead of crashing.
export function listOrEmpty<R>(result: ApiResult<R[]>): { items: R[]; offline: boolean } {
  if (result.ok) return { items: Array.isArray(result.data) ? result.data : [], offline: false };
  return { items: [], offline: result.status === 0 };
}
