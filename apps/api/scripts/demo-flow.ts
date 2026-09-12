import 'dotenv/config';
import { api, approveProposals, log, money, swarmUntilFunded } from './demo-flow.lib';

// The whole AgentIPO story over HTTP, end to end:
//   round → swarm (research, decide, settle) → human approves the advisory ticket →
//   finalize → milestones → exit → claims.
// Usage: pnpm --filter @agentipo/api demo:flow [targetUsdc=20] [proceedsUsdc=target*6]
// (seeded mandates cap each agent at 30–50% of a round, so a small target lets one swarm fill it)
const target = Number(process.argv[2] ?? 20);
const proceeds = Number(process.argv[3] ?? target * 6);
const EQUITY_BPS = 800;

async function main(): Promise<void> {
  const startups = await api<{ id: string; name: string; sector: string }[]>('GET', '/startups');
  const startup = startups.find((s) => s.sector === 'defi') ?? startups[0];
  if (!startup) throw new Error('seed the database first: pnpm db:seed');

  log('1/7', `creating round for ${startup.name}: ${money(target)} for ${EQUITY_BPS / 100}% of the company`);
  const round = await api<{ id: string; onchainRoundId: number | null }>('POST', '/rounds', {
    startupId: startup.id,
    targetUsdc: target,
    minTicketUsdc: 1,
    deadline: new Date(Date.now() + 14 * 86_400_000).toISOString(),
    milestones: [{ title: 'Mainnet', releaseBps: 6_000 }, { title: 'Audit', releaseBps: 4_000 }],
    equityBps: EQUITY_BPS,
  });
  if (round.onchainRoundId === null) throw new Error('round has no escrow — configure ARC_* first');

  log('2/7', 'swarm: every agent researches the round, sizes a ticket and settles it');
  await swarmUntilFunded(round.id, target);

  log('3/7', 'advisory agent: a human approves the ticket it proposed');
  const approved = await approveProposals(round.id);
  if (approved === 0) log('   ', 'no proposals this run (no advisory agent matched the mandate)');

  log('4/7', 'finalize (target met → Funded)');
  const funded = await api<{ status: string; raisedUsdc: number }>('POST', `/rounds/${round.id}/finalize`);
  log('   ', `status ${funded.status}, raised ${money(funded.raisedUsdc)}`);

  log('5/7', 'release both milestones to the founder');
  await api('POST', `/rounds/${round.id}/milestones/release`);
  const closed = await api<{ status: string }>('POST', `/rounds/${round.id}/milestones/release`);
  log('   ', `status ${closed.status}`);

  const valuation = (proceeds * 10_000) / EQUITY_BPS;
  log('6/7', `acquisition at ${money(valuation)} → ${money(proceeds)} to this round's investors`);
  const exited = await api<{ status: string; proceedsUsdc: number }>('POST', `/rounds/${round.id}/exit`, {
    kind: 'ACQUISITION', valuationUsdc: valuation, proceedsUsdc: proceeds, evidenceUri: 'https://example.com/press/acquisition',
  });
  log('   ', `status ${exited.status}, claim pool ${money(exited.proceedsUsdc)}`);

  log('7/7', 'agents claim their pro-rata share of the exit');
  const returns = await api<{ multiple: number; investors: { agentId: string; agentName: string; claimableUsdc: number; contributionUsdc: number }[] }>('GET', `/rounds/${round.id}/returns`);
  for (const inv of returns.investors.filter((i) => i.claimableUsdc > 0)) {
    const c = await api<{ claimedUsdc: number; txHash: string }>('POST', `/agents/${inv.agentId}/claim?roundId=${round.id}`);
    log('   ', `${inv.agentName}: ${money(inv.contributionUsdc)} in → ${money(c.claimedUsdc)} out (${returns.multiple.toFixed(2)}x) · ${c.txHash.slice(0, 12)}…`);
  }
  log('done', `round ${round.id}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
