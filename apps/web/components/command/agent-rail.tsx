import Link from 'next/link';
import type { Agent } from '@agentipo/shared';
import { EmptyState } from '@/components/ui/empty-state';
import { SectionLabel } from '@/components/ui/panel';
import { AgentRow } from './agent-row';

export function AgentRail({ agents }: { agents: Agent[] }) {
  return (
    <div className="flex flex-col">
      <SectionLabel
        right={
          <Link href="/agents" className="text-agent hover:underline">
            {agents.length} agents · manage →
          </Link>
        }
      >
        Agents
      </SectionLabel>
      {agents.length === 0 ? (
        <EmptyState title="No agents yet" hint="Create one on the Agents page — it gets a wallet, a Hedera account and a mandate." />
      ) : (
        <div className="flex flex-col gap-2">
          {agents.map((agent) => (
            <AgentRow key={agent.id} agent={agent} />
          ))}
        </div>
      )}
    </div>
  );
}
