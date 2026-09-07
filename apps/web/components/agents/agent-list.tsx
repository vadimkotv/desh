import type { Agent } from '@agentipo/shared';
import { EmptyState } from '@/components/ui/empty-state';
import { AgentCard } from './agent-card';

export function AgentList({ agents }: { agents: Agent[] }) {
  if (agents.length === 0) {
    return <EmptyState title="No agents yet" hint="Create one with the form — it gets a wallet, a Hedera account and a mandate." />;
  }
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {agents.map((agent) => (
        <AgentCard key={agent.id} agent={agent} />
      ))}
    </div>
  );
}
