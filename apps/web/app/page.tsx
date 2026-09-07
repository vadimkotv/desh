import type { DueDiligencePreview } from '@agentipo/shared';
import { AgentRail } from '@/components/command/agent-rail';
import { KpiStrip } from '@/components/command/kpi-strip';
import { OpenRounds } from '@/components/command/open-rounds';
import { StatusBar } from '@/components/command/status-bar';
import { LivePipeline } from '@/components/live/live-pipeline';
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

export default async function CommandCenterPage() {
  const [healthResult, statsResult, roundsResult, agentsResult, receiptsResult, runsResult] = await Promise.all([
    api.health(),
    api.stats(),
    api.rounds(),
    api.agents(),
    api.receipts(),
    api.runs(8),
  ]);
  const rounds = listOrEmpty(roundsResult);
  const agents = listOrEmpty(agentsResult);
  const receipts = listOrEmpty(receiptsResult);
  const openRounds = rounds.items.filter((round) => round.status === 'OPEN');
  const previews = await loadPreviews(openRounds);
  const investments = rounds.items.flatMap((round) => round.investments ?? []);

  return (
    <div className="flex flex-col gap-4">
      <StatusBar health={healthResult.ok ? healthResult.data : null} />
      {rounds.offline ? (
        <ApiOffline />
      ) : (
        <>
          <KpiStrip stats={statsResult.ok ? statsResult.data : null} investments={investments} receipts={receipts.items} />
          <div className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,5fr)_minmax(0,3fr)]">
            <OpenRounds rounds={openRounds} previews={previews} />
            <LivePipeline agents={agents.items} seed={listOrEmpty(runsResult).items} />
            <AgentRail agents={agents.items} />
          </div>
        </>
      )}
    </div>
  );
}
