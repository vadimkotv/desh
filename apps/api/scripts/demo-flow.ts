import 'dotenv/config';
import { api, log, money, sleep } from './demo-flow.lib';

// The whole AgentIPO story over HTTP, end to end:
//   round → swarm (agents buy data, decide, settle) → finalize → milestones → revenue → claims.
// Usage: pnpm --filter @agentipo/api demo:flow [targetUsdc=20] [revenueUsdc=30]
// (seeded mandates cap each agent at 30–50% of a round, so a small target lets one swarm fill it)
const target = Number(process.argv[2] ?? 20);
const revenue = Number(process.argv[3] ?? target * 1.5);

async function main(): Promise<void> {
  const startups = await api<{ id: string; name: string; sector: string }[]>('GET', '/startups');
  const startup = startups.find((s) => s.sector === 'defi') ?? startups[0];
  if (!startup) throw new Error('seed the database first: pnpm db:seed');

  log('1/6', `creating round for ${startup.name}: target ${money(target)}, cap 1.5x`);
  const round = await api<{ id: string; onchainRoundId: number | null }>('POST', '/rounds', {
    startupId: startup.id,
    targetUsdc: target,
    minTicketUsdc: 1,
    deadline: new Date(Date.now() + 14 * 86_400_000).toISOString(),
    milestones: [{ title: 'Mainnet', releaseBps: 6_000 }, { title: 'Audit', releaseBps: 4_000 }],
    returnCapBps: 15_000,
  });
  if (round.onchainRoundId === null) throw new Error('round has no escrow — configure ARC_* first');

  log('2/6', 'swarm waves: every agent buys the report over x402, decides and settles');
  let raised = 0;
  for (let wave = 1; wave <= 3 && raised < target; wave++) {
    const { runs } = await api<{ runs: { agentName: string }[] }>('POST', `/rounds/${round.id}/swarm`);
    await sleep(12_000);
    raised = (await api<{ raisedUsdc: number }>('GET', `/rounds/${round.id}`)).raisedUsdc;
    log('   ', `wave ${wave}: ${runs.length} agents ran → raised ${money(raised)} of ${money(target)}`);
  }
  const decisions = await api<{ agentId: string; roundId: string; action: string; amountUsdc: number }[]>('GET', '/decisions');
  for (const d of decisions.filter((d) => d.roundId === round.id)) log('   ', `${d.agentId.slice(0, 8)} ${d.action} ${money(d.amountUsdc)}`);

  log('3/6', 'finalize (target met → Funded)');
  const funded = await api<{ status: string; raisedUsdc: number }>('POST', `/rounds/${round.id}/finalize`);
  log('   ', `status ${funded.status}, raised ${money(funded.raisedUsdc)}`);

  log('4/6', 'release both milestones to the founder');
  await api('POST', `/rounds/${round.id}/milestones/release`);
  const closed = await api<{ status: string }>('POST', `/rounds/${round.id}/milestones/release`);
  log('   ', `status ${closed.status}`);

  log('5/6', `route ${money(revenue)} of revenue into the round`);
  const repaid = await api<{ status: string; distributedUsdc: number }>('POST', `/rounds/${round.id}/distribute`, { amountUsdc: revenue });
  log('   ', `status ${repaid.status}, distributed ${money(repaid.distributedUsdc)}`);

  log('6/6', 'agents claim their pro-rata returns');
  const returns = await api<{ investors: { agentId: string; agentName: string; claimableUsdc: number; expectedUsdc: number }[] }>('GET', `/rounds/${round.id}/returns`);
  for (const inv of returns.investors.filter((i) => i.claimableUsdc > 0)) {
    const c = await api<{ claimedUsdc: number; txHash: string }>('POST', `/agents/${inv.agentId}/claim?roundId=${round.id}`);
    log('   ', `${inv.agentName}: claimed ${money(c.claimedUsdc)} of ${money(inv.expectedUsdc)} expected · ${c.txHash.slice(0, 12)}…`);
  }
  log('done', `round ${round.id}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
