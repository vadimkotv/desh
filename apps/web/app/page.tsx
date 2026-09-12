import type { DueDiligencePreview } from '@agentipo/shared';
import { KpiStrip } from '@/components/command/kpi-strip';
import { ReviewFeed } from '@/components/command/review-feed';
import { StatusBar } from '@/components/command/status-bar';
import { ApiOffline } from '@/components/ui/empty-state';
import { api, listOrEmpty } from '@/lib/api';
import { eligibleReviewRounds, potentialReviewRounds, reviewState } from '@/lib/review-rounds';
import type { RoundDetail } from '@/lib/types';

export const dynamic = 'force-dynamic';

async function loadPreviews(
  rounds: RoundDetail[],
): Promise<Map<string, DueDiligencePreview | null>> {
  const entries = await Promise.all(
    rounds.map(async (round) => {
      const result = await api.ddPreview(round.id);
      return [round.id, result.ok ? result.data : null] as const;
    }),
  );
  return new Map(entries);
}

export default async function CommandCenterPage() {
  const [statsResult, roundsResult, agentsResult, receiptsResult, decisionsResult] = await Promise.all([
      api.stats(),
      api.rounds(),
      api.agents(),
      api.receipts(),
      api.decisions(),
  ]);
  const rounds = listOrEmpty(roundsResult);
  const agents = listOrEmpty(agentsResult);
  const receipts = listOrEmpty(receiptsResult);
  const decisions = listOrEmpty(decisionsResult).items;
  const candidates = potentialReviewRounds(rounds.items, agents.items);
  const previews = await loadPreviews(candidates);
  const reviewRounds = eligibleReviewRounds(candidates, agents.items, previews);
  const states = new Map(
    reviewRounds.map((round) => [round.id, reviewState(round, decisions, agents.items)]),
  );
  const investments = rounds.items.flatMap((round) => round.investments ?? []);

  return (
    <div className="flex flex-col gap-4">
      <StatusBar />
      {rounds.offline ? (
        <ApiOffline />
      ) : (
        <>
          <KpiStrip
            stats={statsResult.ok ? statsResult.data : null}
            investments={investments}
            receipts={receipts.items}
          />
          <ReviewFeed
            rounds={reviewRounds}
            previews={previews}
            states={states}
            hasRunningAgents={agents.items.some((agent) => agent.status === 'RUNNING')}
          />
        </>
      )}
    </div>
  );
}
