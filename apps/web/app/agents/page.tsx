import { AgentList } from '@/components/agents/agent-list';
import { CreateAgentForm } from '@/components/agents/create-agent-form';
import { ApiOffline } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { api, listOrEmpty } from '@/lib/api';

export const dynamic = 'force-dynamic';

export default async function AgentsPage() {
  const agents = listOrEmpty(await api.agents());
  return (
    <>
      <PageHeader
        eyebrow="investors"
        title="Agents"
        description="Each agent holds its own wallet, pays for data over x402, and can only act inside the mandate its owner wrote."
        action={!agents.offline && <span className="font-mono text-[11px] text-muted">{agents.items.length} registered</span>}
      />
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">{agents.offline ? <ApiOffline /> : <AgentList agents={agents.items} />}</div>
        <div className="lg:col-span-2">
          <CreateAgentForm />
        </div>
      </div>
    </>
  );
}
