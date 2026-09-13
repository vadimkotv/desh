import { api } from './demo-flow.lib';

export type Verdict = { name: string; status: 'PASS' | 'FAIL' | 'SKIP'; detail: string };
type Features = Record<string, boolean>;
type Ctx = { features: Features; startupId: string; roundId: string };

const pass = (name: string, detail: string): Verdict => ({ name, status: 'PASS', detail });
const fail = (name: string, detail: string): Verdict => ({ name, status: 'FAIL', detail });
const skip = (name: string, detail: string): Verdict => ({ name, status: 'SKIP', detail });

// Each check makes a real request through the API, so a green line means the integration
// answered, not that the env var is set. `off` names the key that turns it on.
async function signalsBySource(startupId: string): Promise<Map<string, number>> {
  await api('POST', `/data-room/startups/${startupId}/refresh`).catch(() => undefined);
  const signals = await api<{ source: string }[]>('GET', `/data-room/startups/${startupId}/signals`);
  const counts = new Map<string, number>();
  for (const s of signals) counts.set(s.source, (counts.get(s.source) ?? 0) + 1);
  return counts;
}

function graph(name: string, feature: string, off: string, counts: Map<string, number>, ctx: Ctx): Verdict {
  if (!ctx.features[feature]) return fail(name, `off: set ${off}`);
  const n = counts.get(name) ?? 0;
  if (n === 0) return fail(name, `${feature} is on but the last refresh produced no ${name} signals`);
  const fixtures = counts.get('demo-fixture') ?? 0;
  return fixtures ? fail(name, `${n} live signals but ${fixtures} fixtures too: set DEMO_SIGNALS=false`) : pass(name, `${n} signals`);
}

async function llm(ctx: Ctx): Promise<Verdict> {
  if (!ctx.features.llm) return fail('claude', 'off: set ANTHROPIC_API_KEY');
  const decisions = await api<{ engine: string; createdAt: string }[]>('GET', '/decisions');
  const latest = decisions.sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  if (!latest) return skip('claude', 'key present, no decisions yet: run a swarm');
  return latest.engine.startsWith('rules') ? fail('claude', `latest decision used ${latest.engine}`) : pass('claude', `latest decision engine ${latest.engine}`);
}

async function escrow(ctx: Ctx): Promise<Verdict> {
  if (!ctx.features.arcEscrow) return fail('arc-escrow', 'off: set ARC_ESCROW_ADDRESS + ARC_PLATFORM_PRIVATE_KEY');
  const rounds = await api<{ onchainRoundId: number | null; investments: { status: string }[] }[]>('GET', '/rounds');
  const onchain = rounds.filter((r) => r.onchainRoundId !== null).length;
  const confirmed = rounds.flatMap((r) => r.investments).filter((i) => i.status === 'CONFIRMED').length;
  if (onchain === 0) return fail('arc-escrow', `escrow configured but none of ${rounds.length} rounds has an on-chain id`);
  return pass('arc-escrow', `${onchain}/${rounds.length} rounds on-chain, ${confirmed} confirmed investments`);
}

async function hcs(ctx: Ctx): Promise<Verdict> {
  if (!ctx.features.hcs) return fail('hedera-hcs', 'off: set HEDERA_OPERATOR_ID + HEDERA_OPERATOR_KEY');
  const entries = await api<{ hcsTopicId: string | null; hcsSequenceNumber: number | null }[]>('GET', '/audit');
  const anchored = entries.filter((e) => e.hcsTopicId);
  const last = anchored[0];
  if (!last) return entries.length ? fail('hedera-hcs', `${entries.length} audit entries, none anchored on HCS`) : skip('hedera-hcs', 'no audit entries yet: run a swarm');
  return pass('hedera-hcs', `${anchored.length}/${entries.length} anchored, topic ${last.hcsTopicId} seq ${last.hcsSequenceNumber}; pin HEDERA_HCS_TOPIC_ID=${last.hcsTopicId}`);
}

async function x402(ctx: Ctx): Promise<Verdict> {
  if (!ctx.features.x402) return skip('x402', 'off by design (X402_GATE_REPORTS=false); flip it briefly for a HashScan proof');
  const res = await fetch(`${process.env.API_PUBLIC_URL ?? 'http://localhost:4000'}/due-diligence/rounds/${ctx.roundId}/premium`);
  return res.status === 402 ? pass('x402', 'premium report answers HTTP 402 with payment requirements') : fail('x402', `expected 402, got ${res.status}`);
}

async function erc8004(): Promise<Verdict> {
  const agents = await api<{ erc8004AgentId: string | null }[]>('GET', '/agents');
  const registered = agents.filter((a) => a.erc8004AgentId).length;
  return registered ? pass('erc-8004', `${registered}/${agents.length} agents registered`) : skip('erc-8004', 'no agent registered: fund a wallet with Sepolia ETH, then POST /agents/:id/identity');
}

export async function runChecks(ctx: Ctx): Promise<Verdict[]> {
  const counts = await signalsBySource(ctx.startupId);
  const f = ctx.features;
  return [
    graph('graph-token-api', 'graphTokenApi', 'GRAPH_TOKEN_API_JWT', counts, ctx),
    graph('graph-messari-dex', 'messariDex', 'GRAPH_GATEWAY_API_KEY + GRAPH_MESSARI_DEX_SUBGRAPH_ID', counts, ctx),
    graph('graph-agent0', 'graphGateway', 'GRAPH_GATEWAY_API_KEY', counts, ctx),
    await llm(ctx),
    await escrow(ctx),
    await hcs(ctx),
    await x402(ctx),
    await erc8004(),
    f.privy ? pass('privy', 'sessions verified against the Privy JWKS') : fail('privy', 'off: set PRIVY_APP_ID + NEXT_PUBLIC_PRIVY_APP_ID'),
    f.circleWallets ? pass('circle-wallets', 'CIRCLE wallet kind available') : skip('circle-wallets', 'off: CIRCLE_API_KEY + CIRCLE_ENTITY_SECRET + CIRCLE_WALLET_SET_ID'),
  ];
}
