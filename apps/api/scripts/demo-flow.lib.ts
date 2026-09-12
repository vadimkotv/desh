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

export interface RoundState {
  raisedUsdc: number;
}

// Runs the swarm until the round is full or we run out of waves. Every agent decides
// once per wave; advisory agents file proposals instead of settling, which is why a
// wave can add less than the sum of its verdicts.
export async function swarmUntilFunded(roundId: string, target: number, waves = 4): Promise<number> {
  let raised = 0;
  for (let wave = 1; wave <= waves && raised < target; wave++) {
    const { runs } = await api<{ runs: unknown[] }>('POST', `/rounds/${roundId}/swarm`);
    await sleep(12_000);
    raised = (await api<RoundState>('GET', `/rounds/${roundId}`)).raisedUsdc;
    log('   ', `wave ${wave}: ${runs.length} agents ran → raised ${money(raised)} of ${money(target)}`);
  }
  return raised;
}

export interface Proposal {
  id: string;
  agentId: string;
  roundId: string;
  amountUsdc: number;
  reasoning: string;
}

// The human half of an advisory agent: whatever it proposed for this round, approve it.
export async function approveProposals(roundId: string): Promise<number> {
  const pending = (await api<Proposal[]>('GET', '/decisions/pending')).filter((p) => p.roundId === roundId);
  for (const proposal of pending) {
    log('   ', `proposal ${money(proposal.amountUsdc)} — ${proposal.reasoning.slice(0, 90)}…`);
    await api('POST', `/decisions/${proposal.id}/approve`, { approvedBy: 'demo-operator' });
    log('   ', `approved → settled on Arc`);
  }
  return pending.length;
}
