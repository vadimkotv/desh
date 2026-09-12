import Link from 'next/link';
import type { Agent } from '@agentipo/shared';
import { Badge } from '@/components/ui/badge';
import { formatDate, shortAddress } from '@/lib/format';
import { MandateBars } from './mandate-bars';

const riskTone = { conservative: 'info', balanced: 'accent', aggressive: 'amber' } as const;

export function AgentCard({ agent }: { agent: Agent }) {
  return (
    <Link
      href={`/agents/${agent.id}`}
      className="group flex flex-col gap-3 rounded-lg border border-line bg-panel/90 p-4 transition-colors hover:border-agent/50"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-[14px] font-semibold text-bright group-hover:text-agent">
            {agent.name}
          </h3>
          <p className="font-mono text-[10.5px] text-muted">
            owner {shortAddress(agent.ownerAddress)} · {formatDate(agent.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Badge tone={agent.status === 'RUNNING' ? 'agent' : 'neutral'}>
            {agent.status === 'RUNNING' && <span className="live-dot">●</span>}
            {agent.status === 'RUNNING' ? 'Running' : 'Paused'}
          </Badge>
          <Badge tone={riskTone[agent.mandate.riskTolerance]}>{agent.mandate.riskTolerance}</Badge>
          <Badge
            tone={agent.mode === 'ADVISORY' ? 'amber' : 'accent'}
            title={agent.mode === 'ADVISORY' ? 'researches on its own, a human approves every ticket' : 'settles its own tickets within the mandate'}
          >
            {agent.mode === 'ADVISORY' ? '✋ advisory' : '⚡ autonomous'}
          </Badge>
        </div>
      </div>
      <p className="line-clamp-2 text-[12px] italic leading-relaxed text-muted">
        “{agent.mandate.thesis}”
      </p>
      <div className="flex flex-wrap gap-1">
        {agent.mandate.sectors.map((s) => (
          <Badge key={s} tone="info">
            {s}
          </Badge>
        ))}
        {agent.erc8004AgentId ? (
          <Badge tone="agent">ERC-8004 #{agent.erc8004AgentId}</Badge>
        ) : (
          <Badge tone="neutral">ERC-8004 —</Badge>
        )}
        {agent.hederaAccountId && <Badge tone="amber">ℏ {agent.hederaAccountId}</Badge>}
        {agent.walletAddress && (
          <Badge tone="neutral" className="normal-case">
            {shortAddress(agent.walletAddress)}
          </Badge>
        )}
      </div>
      <MandateBars mandate={agent.mandate} compact />
    </Link>
  );
}
