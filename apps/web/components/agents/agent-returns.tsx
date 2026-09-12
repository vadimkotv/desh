'use client';

import { useEffect, useState } from 'react';
import type { RoundReturns } from '@agentipo/shared';
import { ClaimButton } from '@/components/rounds/claim-button';
import { Panel } from '@/components/ui/panel';
import { api } from '@/lib/api';
import { num } from '@/lib/format';

type AgentReturnsProps = { agentId: string; roundIds: string[]; roundNames: Record<string, string> };
type Row = { roundId: string; status: string; claimable: number; claimed: number; contributed: number };

const rowFor = (agentId: string, r: RoundReturns): Row | null => {
  const me = r.investors.find((i) => i.agentId === agentId);
  return me ? { roundId: r.roundId, status: r.status, claimable: me.claimableUsdc, claimed: me.claimedUsdc, contributed: me.contributionUsdc } : null;
};

// "Claimable now": one /rounds/:id/returns lookup per round the agent invested in.
export function AgentReturns({ agentId, roundIds, roundNames }: AgentReturnsProps) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    Promise.all(roundIds.map((id) => api.roundReturns(id))).then((results) => {
      if (cancelled) return;
      setRows(results.flatMap((r) => (r.ok ? [rowFor(agentId, r.data)] : [])).filter((r): r is Row => r !== null));
    });
    return () => {
      cancelled = true;
    };
  }, [agentId, roundIds, tick]);

  const claimable = rows?.reduce((s, r) => s + r.claimable, 0) ?? 0;
  return (
    <Panel eyebrow="exit proceeds" title="Claimable now" tone="accent" action={<span className="num text-[10.5px] text-accent">{num(claimable)} USDC</span>} bodyClassName="p-0">
      {rows === null ? (
        <p className="p-4 font-mono text-[11px] text-dim"><span className="live-dot">●</span> reading escrows…</p>
      ) : rows.length === 0 ? (
        <p className="p-4 text-[12px] text-muted">No on-chain positions yet — proceeds appear once this agent has invested in a round that exits.</p>
      ) : (
        <ul className="divide-y divide-line">
          {rows.map((row) => (
            <li key={row.roundId} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 font-mono text-[11px]">
              <span className="min-w-0">
                <span className="text-fg">{roundNames[row.roundId] ?? row.roundId.slice(0, 8)}</span>
                <span className="ml-1.5 text-dim">{row.status} · {num(row.contributed)} in → {num(row.claimed)} claimed</span>
              </span>
              <span className="flex items-center gap-2">
                <span className={`num ${row.claimable > 0 ? 'text-accent' : 'text-dim'}`}>{num(row.claimable)} USDC</span>
                <ClaimButton agentId={agentId} roundId={row.roundId} claimableUsdc={row.claimable} onClaimed={() => setTick((t) => t + 1)} />
              </span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
