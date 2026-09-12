import type { Agent } from '@agentipo/shared';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/format';

const riskTone = { conservative: 'info', balanced: 'accent', aggressive: 'amber' } as const;

export function AgentHeader({ agent }: { agent: Agent }) {
  const advisory = agent.mode === 'ADVISORY';
  return (
    <div>
      <p className="eyebrow text-agent">agent console</p>
      <div className="mt-1 flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-bright">{agent.name}</h1>
        <Badge tone={agent.status === 'RUNNING' ? 'agent' : 'neutral'}>
          {agent.status === 'RUNNING' && <span className="live-dot">●</span>}
          {agent.status === 'RUNNING' ? 'Running' : 'Paused'}
        </Badge>
        <Badge tone={riskTone[agent.mandate.riskTolerance]}>{agent.mandate.riskTolerance}</Badge>
        <Badge
          tone={advisory ? 'amber' : 'accent'}
          title={advisory ? 'researches on its own, a human approves every ticket' : 'settles its own tickets within the mandate'}
        >
          {advisory ? '✋ advisory' : '⚡ autonomous'}
        </Badge>
      </div>
      <p className="mt-1 font-mono text-[10.5px] text-muted">
        id {agent.id} · created {formatDate(agent.createdAt)}
      </p>
    </div>
  );
}
