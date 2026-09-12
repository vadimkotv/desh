import { notFound } from 'next/navigation';
import { AgentConsole } from '@/components/agents/agent-console';
import { AgentHeader } from '@/components/agents/agent-header';
import { AgentReturns } from '@/components/agents/agent-returns';
import { StatTile } from '@/components/charts/stat-tile';
import { DecisionTimeline } from '@/components/agents/decision-timeline';
import { IdentityPanel } from '@/components/agents/identity-panel';
import { MandateCard } from '@/components/agents/mandate-card';
import { ReceiptsList } from '@/components/agents/receipts-list';
import { ApiOffline } from '@/components/ui/empty-state';
import { api, listOrEmpty } from '@/lib/api';
import { num, usdc } from '@/lib/format';
import { isOffline } from '@/lib/types';

export const dynamic = 'force-dynamic';

type AgentPageProps = { params: Promise<{ id: string }> };

export default async function AgentPage({ params }: AgentPageProps) {
  const { id } = await params;
  const [agentResult, decisionsResult, receiptsResult, roundsResult] = await Promise.all([
    api.agent(id),
    api.agentDecisions(id),
    api.receipts(),
    api.rounds(),
  ]);
  if (isOffline(agentResult)) return <ApiOffline />;
  if (!agentResult.ok) notFound();
  const agent = agentResult.data;
  const decisions = listOrEmpty(decisionsResult).items;
  const receipts = listOrEmpty(receiptsResult).items.filter((r) => r.agentId === agent.id);
  const rounds = listOrEmpty(roundsResult).items;
  const roundNames = new Map(rounds.map((r) => [r.id, r.startup.name]));
  const roundTerms = new Map(rounds.map((r) => [r.id, { targetUsdc: r.targetUsdc, equityBps: r.equityBps }]));
  const confirmed = decisions.filter((d) => d.investment?.status === 'CONFIRMED');
  const invested = confirmed.reduce((s, d) => s + (d.investment?.amountUsdc ?? 0), 0);
  const claimed = confirmed.reduce((s, d) => s + (d.investment?.claimedUsdc ?? 0), 0);
  const roundIds = [...new Set(confirmed.map((d) => d.roundId))];

  return (
    <div className="flex flex-col gap-4">
      <AgentHeader agent={agent} />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <AgentConsole agentId={agent.id} initialStatus={agent.status} />
          <div className="grid gap-2 sm:grid-cols-3">
            <StatTile
              label="Invested"
              value={usdc(invested)}
              hint={`${confirmed.length} confirmed tickets`}
              tone="accent"
            />
            <StatTile
              label="Returns claimed"
              value={usdc(claimed)}
              hint={
                invested > 0
                  ? `${num((claimed / invested) * 100)}% of capital back`
                  : 'no capital deployed'
              }
              tone="accent"
            />
            <StatTile
              label="Decisions"
              value={num(decisions.length)}
              hint={`${decisions.filter((d) => d.action === 'INVEST').length} invest · ${decisions.filter((d) => d.action !== 'INVEST').length} pass/watch`}
              tone="agent"
            />
          </div>
          <DecisionTimeline decisions={decisions} roundNames={roundNames} roundTerms={roundTerms} />
        </div>
        <div className="flex flex-col gap-4">
          <IdentityPanel agent={agent} />
          <AgentReturns
            agentId={agent.id}
            roundIds={roundIds}
            roundNames={Object.fromEntries(roundNames)}
          />
          <MandateCard mandate={agent.mandate} />
          <ReceiptsList receipts={receipts} />
        </div>
      </div>
    </div>
  );
}
