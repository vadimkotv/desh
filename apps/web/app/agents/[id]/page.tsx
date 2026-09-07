import { notFound } from 'next/navigation';
import { AgentConsole } from '@/components/agents/agent-console';
import { AgentReturns } from '@/components/agents/agent-returns';
import { StatTile } from '@/components/charts/stat-tile';
import { DecisionTimeline } from '@/components/agents/decision-timeline';
import { IdentityPanel } from '@/components/agents/identity-panel';
import { MandateCard } from '@/components/agents/mandate-card';
import { ReceiptsList } from '@/components/agents/receipts-list';
import { Badge } from '@/components/ui/badge';
import { ApiOffline } from '@/components/ui/empty-state';
import { api, listOrEmpty } from '@/lib/api';
import { formatDate, num, usdc } from '@/lib/format';
import { isOffline } from '@/lib/types';

export const dynamic = 'force-dynamic';

type AgentPageProps = { params: Promise<{ id: string }> };

const riskTone = { conservative: 'info', balanced: 'accent', aggressive: 'amber' } as const;

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
  const roundCaps = new Map(rounds.map((r) => [r.id, r.returnCapBps]));
  const confirmed = decisions.filter((d) => d.investment?.status === 'CONFIRMED');
  const invested = confirmed.reduce((s, d) => s + (d.investment?.amountUsdc ?? 0), 0);
  const claimed = confirmed.reduce((s, d) => s + (d.investment?.claimedUsdc ?? 0), 0);
  const roundIds = [...new Set(confirmed.map((d) => d.roundId))];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow text-agent">agent console</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-bright">{agent.name}</h1>
            <Badge tone={riskTone[agent.mandate.riskTolerance]}>{agent.mandate.riskTolerance}</Badge>
          </div>
          <p className="mt-1 font-mono text-[10.5px] text-muted">
            id {agent.id} · created {formatDate(agent.createdAt)}
          </p>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <AgentConsole agentId={agent.id} agentName={agent.name} />
          <div className="grid gap-2 sm:grid-cols-3">
            <StatTile label="Invested" value={usdc(invested)} hint={`${confirmed.length} confirmed tickets`} tone="accent" />
            <StatTile label="Returns claimed" value={usdc(claimed)} hint={invested > 0 ? `${num((claimed / invested) * 100)}% of capital back` : 'no capital deployed'} tone="accent" />
            <StatTile label="Decisions" value={num(decisions.length)} hint={`${decisions.filter((d) => d.action === 'INVEST').length} invest · ${decisions.filter((d) => d.action !== 'INVEST').length} pass/watch`} tone="agent" />
          </div>
          <DecisionTimeline decisions={decisions} roundNames={roundNames} roundCaps={roundCaps} />
        </div>
        <div className="flex flex-col gap-4">
          <IdentityPanel agent={agent} />
          <AgentReturns agentId={agent.id} roundIds={roundIds} roundNames={Object.fromEntries(roundNames)} />
          <MandateCard mandate={agent.mandate} />
          <ReceiptsList receipts={receipts} />
        </div>
      </div>
    </div>
  );
}
