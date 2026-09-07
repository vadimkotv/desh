const base = process.env.API_PUBLIC_URL ?? 'http://localhost:4000';

export async function api<T>(method: 'GET' | 'POST', path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${base}${path}`, {
    method,
    headers: body ? { 'content-type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${path} → HTTP ${res.status}: ${text.slice(0, 300)}`);
  return (text ? JSON.parse(text) : null) as T;
}

export const log = (step: string, message: string): void => console.log(`[${step}] ${message}`);
export const money = (n: number): string => `${n.toFixed(2)} USDC`;
export const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));
