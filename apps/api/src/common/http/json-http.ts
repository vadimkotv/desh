// The single place where the API performs outbound JSON HTTP calls.
// Adapters compose this instead of calling fetch directly (no duplicated plumbing).
export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly url: string,
    readonly body: string,
  ) {
    super(`HTTP ${status} from ${url}: ${body.slice(0, 200)}`);
  }
}

export interface JsonHttpOptions {
  headers?: Record<string, string>;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}

export async function getJson<T>(url: string, opts: JsonHttpOptions = {}): Promise<T> {
  return request<T>(url, { method: 'GET' }, opts);
}

export async function postJson<T>(url: string, body: unknown, opts: JsonHttpOptions = {}): Promise<T> {
  const headers = { 'content-type': 'application/json', ...(opts.headers ?? {}) };
  return request<T>(url, { method: 'POST', body: JSON.stringify(body) }, { ...opts, headers });
}

async function request<T>(url: string, init: RequestInit, opts: JsonHttpOptions): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 15_000);
  const doFetch = opts.fetchImpl ?? fetch;
  try {
    const res = await doFetch(url, { ...init, headers: opts.headers, signal: controller.signal });
    const text = await res.text();
    if (!res.ok) throw new HttpError(res.status, url, text);
    return (text ? JSON.parse(text) : null) as T;
  } finally {
    clearTimeout(timer);
  }
}
