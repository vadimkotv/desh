import type { DueDiligencePreview } from '@agentipo/shared';
import { Hero } from '@/components/home/hero';
import { StatsRow } from '@/components/home/stats-row';
import { RoundGrid } from '@/components/rounds/round-grid';
import { ApiOffline } from '@/components/ui/empty-state';
import { api, listOrEmpty } from '@/lib/api';
import type { RoundDetail } from '@/lib/types';

export const dynamic = 'force-dynamic';

async function loadPreviews(rounds: RoundDetail[]): Promise<Map<string, DueDiligencePreview | null>> {
  const entries = await Promise.all(
    rounds.map(async (round) => {
      const result = await api.ddPreview(round.id);
      return [round.id, result.ok ? result.data : null] as const;
    }),
  );
  return new Map(entries);
}

export default async function HomePage() {
  const [roundsResult, agentsResult, decisionsResult] = await Promise.all([
    api.rounds(),
    api.agents(),
    api.decisions(),
  ]);
  const rounds = listOrEmpty(roundsResult);
  const agents = listOrEmpty(agentsResult);
  const openRounds = rounds.items.filter((round) => round.status === 'OPEN');
  const previews = await loadPreviews(openRounds);
  const totalRaised = rounds.items.reduce((sum, round) => sum + round.raisedUsdc, 0);

  return (
    <>
      <Hero />
      {rounds.offline ? (
        <ApiOffline />
      ) : (
        <>
          <StatsRow
            openRounds={openRounds.length}
            totalRaisedUsdc={totalRaised}
            agents={agents.items.length}
            decisions={decisionsResult.ok ? decisionsResult.data.length : null}
          />
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-mono text-[11px] uppercase tracking-[0.25em] text-muted">Open rounds</h2>
            <span className="font-mono text-[11px] text-muted">{openRounds.length} live</span>
          </div>
          <RoundGrid rounds={openRounds} previews={previews} />
        </>
      )}
    </>
  );
}
