import 'dotenv/config';
import { api } from './demo-flow.lib';
import { runChecks } from './verify-integrations.lib';

// One command instead of ten screens: exercises every sponsor integration through the
// running API and prints PASS / FAIL / skip with the reason and the key that fixes it.
//   API_PUBLIC_URL=https://api.example.com pnpm verify:integrations
async function main(): Promise<void> {
  const base = process.env.API_PUBLIC_URL ?? 'http://localhost:4000';
  const health = await api<{ ok: boolean; features: Record<string, boolean> }>('GET', '/health');
  const rounds = await api<{ id: string; startupId: string }[]>('GET', '/rounds');
  const round = rounds[0];
  if (!round) throw new Error('no rounds: seed the database first');
  console.log(`API ${base}, health ${health.ok ? 'ok' : 'NOT ok'}\n`);

  const verdicts = await runChecks({ features: health.features, startupId: round.startupId, roundId: round.id });
  const width = Math.max(...verdicts.map((v) => v.name.length));
  for (const v of verdicts) console.log(`${v.status === 'SKIP' ? 'skip' : v.status} ${v.name.padEnd(width)}  ${v.detail}`);

  const failed = verdicts.filter((v) => v.status === 'FAIL').length;
  console.log(`\n${verdicts.length - failed}/${verdicts.length} green${failed ? `, ${failed} failing` : ''}`);
  process.exit(failed ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
