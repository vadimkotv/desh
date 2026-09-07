import Link from 'next/link';
import type { Agent } from '@agentipo/shared';
import { formatDate, shortAddress } from '@/lib/format';
import { AgentIdentity } from './agent-identity';
import { MandateSummary } from './mandate-summary';

export function AgentCard({ agent }: { agent: Agent }) {
  return (
    <Link
      href={`/agents/${agent.id}`}
      className="group flex flex-col gap-3 rounded-lg border border-line bg-panel/90 p-4 transition hover:border-accent/50"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-fg group-hover:text-accent">{agent.name}</h3>
          <p className="font-mono text-[11px] text-muted">
            owner {shortAddress(agent.ownerAddress)} · {formatDate(agent.createdAt)}
          </p>
        </div>
      </div>
      <AgentIdentity agent={agent} />
      <MandateSummary mandate={agent.mandate} />
    </Link>
  );
}
