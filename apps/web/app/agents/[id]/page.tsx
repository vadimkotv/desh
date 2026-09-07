import { notFound } from 'next/navigation';
import { AgentIdentity } from '@/components/agents/agent-identity';
import { DecisionFeed } from '@/components/agents/decision-feed';
import { MandateCard } from '@/components/agents/mandate-card';
import { RunAgentButton } from '@/components/agents/run-agent-button';
import { CopyButton } from '@/components/ui/copy-button';
import { ApiOffline } from '@/components/ui/empty-state';
import { api, listOrEmpty } from '@/lib/api';
import { formatDate } from '@/lib/format';
import { isOffline } from '@/lib/types';

export const dynamic = 'force-dynamic';

type AgentPageProps = { params: Promise<{ id: string }> };

export default async function AgentPage({ params }: AgentPageProps) {
  const { id } = await params;
  const [agentResult, decisionsResult] = await Promise.all([api.agent(id), api.agentDecisions(id)]);
  if (isOffline(agentResult)) return <ApiOffline />;
  if (!agentResult.ok) notFound();
  const agent = agentResult.data;
  const decisions = listOrEmpty(decisionsResult).items;

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border border-line bg-panel/90 p-5">
        <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-accent">agent</p>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-fg">{agent.name}</h1>
          <span className="flex items-center gap-1 font-mono text-[11px] text-muted">
            owner <CopyButton value={agent.ownerAddress} />
          </span>
        </div>
        <p className="mt-1 font-mono text-[11px] text-muted">
          id {agent.id} · created {formatDate(agent.createdAt)}
        </p>
        <div className="mt-3">
          <AgentIdentity agent={agent} />
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <div className="rounded-lg border border-line bg-panel/90 p-4">
            <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-muted">pipeline</p>
            <RunAgentButton agentId={agent.id} />
          </div>
          <DecisionFeed decisions={decisions} />
        </div>
        <MandateCard mandate={agent.mandate} />
      </div>
    </div>
  );
}
