'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { Agent } from '@agentipo/shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useWalletBalance } from '@/hooks/use-wallet-balance';
import { api } from '@/lib/api';
import { num, shortAddress } from '@/lib/format';

const riskTone = { conservative: 'info', balanced: 'accent', aggressive: 'amber' } as const;

// Agent rail row: mandate one-liner, wallet + live USDC balance, identity badges,
// and a per-agent Run button whose run then lights up in the live pipeline.
export function AgentRow({ agent }: { agent: Agent }) {
  const balance = useWalletBalance(agent.walletAddress);
  const [launch, setLaunch] = useState<'idle' | 'busy' | 'sent' | 'error'>('idle');
  const { mandate } = agent;

  async function run() {
    setLaunch('busy');
    const result = await api.startRun(agent.id);
    setLaunch(result.ok ? 'sent' : 'error');
    setTimeout(() => setLaunch('idle'), 3500);
  }

  return (
    <article className="group flex flex-col gap-2 rounded-lg border border-line bg-panel/90 p-3 transition-colors hover:border-agent/40">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <Link href={`/agents/${agent.id}`} className="block truncate text-[13px] font-semibold text-bright group-hover:text-agent">
            {agent.name}
          </Link>
          <p className="mt-0.5 font-mono text-[10.5px] text-muted">
            <Badge tone={riskTone[mandate.riskTolerance]} className="mr-1.5">{mandate.riskTolerance}</Badge>
            min {mandate.minScore} · max {num(mandate.maxTicketUsdc)} USDC
          </p>
        </div>
        <Button variant="agent" size="xs" busy={launch === 'busy'} onClick={run} title="POST /agents/:id/runs">
          {launch === 'sent' ? '✓ queued' : launch === 'error' ? 'failed' : '▶ Run'}
        </Button>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 font-mono text-[10.5px]">
        <span className="text-muted" title={agent.walletAddress ?? 'wallet pending'}>
          {agent.walletAddress ? shortAddress(agent.walletAddress) : 'wallet pending'}
        </span>
        <span className="num text-fg">
          {balance.status === 'loading' ? <span className="text-dim">…</span> : balance.status === 'ok' && balance.usdc !== null ? `${num(balance.usdc)} USDC` : <span className="text-dim">— USDC</span>}
        </span>
      </div>
      <div className="flex flex-wrap gap-1">
        {agent.erc8004AgentId ? <Badge tone="agent">ERC-8004 #{agent.erc8004AgentId}</Badge> : <Badge tone="neutral">ERC-8004 unregistered</Badge>}
        {agent.hederaAccountId ? <Badge tone="amber">ℏ {agent.hederaAccountId}</Badge> : <Badge tone="neutral">no hedera</Badge>}
        {agent.walletKind === 'CIRCLE' && <Badge tone="info">circle wallet</Badge>}
      </div>
    </article>
  );
}
