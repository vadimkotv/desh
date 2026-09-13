import { ApprovalQueue } from '@/components/command/approval-queue';
import { KpiStrip } from '@/components/command/kpi-strip';
import { LiveRefresh } from '@/components/command/live-refresh';
import { ReviewFeed } from '@/components/command/review-feed';
import { RoleCta } from '@/components/command/role-cta';
import { StatusBar } from '@/components/command/status-bar';
import { ApiOffline } from '@/components/ui/empty-state';
import { api, listOrEmpty } from '@/lib/api';

export const dynamic = 'force-dynamic';

export default async function CommandCenterPage() {
  const [statsResult, roundsResult, agentsResult, receiptsResult, feedResult, pendingResult] =
    await Promise.all([
      api.stats(),
      api.rounds(),
      api.agents(),
      api.receipts(),
      api.reviewFeed(),
      api.pendingDecisions(),
    ]);
  const rounds = listOrEmpty(roundsResult);
  const agents = listOrEmpty(agentsResult);
  const receipts = listOrEmpty(receiptsResult);
  // The API decides what is in the feed and why — the same mandate gate the agents
  // themselves apply — so this page only has to line the items up with their rounds.
  const feed = listOrEmpty(feedResult).items;
  const byId = new Map(rounds.items.map((round) => [round.id, round]));
  const items = feed.flatMap((item) => {
    const round = byId.get(item.roundId);
    return round ? [{ ...item, round }] : [];
  });
  const investments = rounds.items.flatMap((round) => round.investments ?? []);
  const proposals = listOrEmpty(pendingResult).items;

  return (
    <div className="flex flex-col gap-4">
      <LiveRefresh />
      <StatusBar />
      <RoleCta />
      {rounds.offline ? (
        <ApiOffline />
      ) : (
        <>
          <KpiStrip
            stats={statsResult.ok ? statsResult.data : null}
            investments={investments}
            receipts={receipts.items}
          />
          <ApprovalQueue
            proposals={proposals}
            rounds={byId}
            agents={new Map(agents.items.map((agent) => [agent.id, agent]))}
          />
          <ReviewFeed
            items={items}
            hasRunningAgents={agents.items.some((agent) => agent.status === 'RUNNING')}
          />
        </>
      )}
    </div>
  );
}
