import 'dotenv/config';

// CLI: run one agent against the platform API (what a cron / scheduler would call).
//   pnpm --filter @agentipo/api agent:run -- <agentId> [roundId]
const [agentId, roundId] = process.argv.slice(2);
const api = process.env.API_PUBLIC_URL ?? 'http://localhost:4000';

async function main(): Promise<void> {
  if (!agentId) {
    const agents = (await (await fetch(`${api}/agents`)).json()) as { id: string; name: string }[];
    console.log('Usage: agent:run <agentId> [roundId]\nKnown agents:');
    for (const a of agents) console.log(`  ${a.id}  ${a.name}`);
    return;
  }
  const url = new URL(`${api}/agents/${agentId}/run`);
  if (roundId) url.searchParams.set('roundId', roundId);
  const res = await fetch(url, { method: 'POST' });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  const decisions = (await res.json()) as {
    roundId: string; action: string; amountUsdc: number; engine: string; reasoning: string;
    dataPaymentTxId: string | null; investment: { status: string; txHash: string | null } | null;
  }[];
  for (const d of decisions) {
    console.log(`\n[${d.action}] round ${d.roundId} — ${d.amountUsdc} USDC via ${d.engine}`);
    console.log(`  data paid: ${d.dataPaymentTxId ?? 'free'} | settlement: ${d.investment?.status ?? '-'} ${d.investment?.txHash ?? ''}`);
    console.log(`  ${d.reasoning}`);
  }
  if (!decisions.length) console.log('No open rounds matched the mandate.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
