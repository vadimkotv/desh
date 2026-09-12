import Link from 'next/link';
import type { Agent } from '@agentipo/shared';
import { ActionPill } from '@/components/ui/action-pill';
import { Badge } from '@/components/ui/badge';
import { ConfidenceBar } from '@/components/ui/confidence-bar';
import { bpsShare, equityShareBps, num } from '@/lib/format';
import type { RunView } from '@/lib/run-state';

type SwarmTableProps = { views: RunView[]; agents: Agent[]; round: { targetUsdc: number; equityBps: number } };

const riskTone = { conservative: 'info', balanced: 'accent', aggressive: 'amber' } as const;

// "The market forms from mandates": the same round, four mandates, four verdicts.
export function SwarmTable({ views, agents, round }: SwarmTableProps) {
  const byId = new Map(agents.map((a) => [a.id, a]));
  const rows = [...views].sort((a, b) => (b.decision?.amountUsdc ?? -1) - (a.decision?.amountUsdc ?? -1));
  return (
    <div className="overflow-x-auto rounded-lg border border-agent/30 bg-panel/90">
      <table className="w-full min-w-[640px] text-left font-mono text-[11px]">
        <thead className="border-b border-line text-[10px] uppercase tracking-wider text-muted">
          <tr>
            <th className="px-3 py-2 font-normal">agent</th>
            <th className="py-2 pr-3 font-normal">mandate</th>
            <th className="py-2 pr-3 font-normal">action</th>
            <th className="py-2 pr-3 text-right font-normal">amount</th>
            <th className="py-2 pr-3 text-right font-normal">equity ({bpsShare(round.equityBps)} total)</th>
            <th className="py-2 pr-3 font-normal">confidence</th>
            <th className="py-2 pr-3 font-normal">engine</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((view) => {
            const agent = byId.get(view.agentId);
            const gateFailed = view.steps.gate === 'failed';
            return (
              <tr key={view.runId} className="fade-in transition-colors hover:bg-hover">
                <td className="px-3 py-2">
                  <Link href={`/agents/${view.agentId}`} className="text-bright hover:text-agent">{agent?.name ?? view.agentName ?? view.agentId.slice(0, 8)}</Link>
                </td>
                <td className="py-2 pr-3">
                  {agent ? (
                    <span className="flex items-center gap-1.5">
                      <Badge tone={riskTone[agent.mandate.riskTolerance]}>{agent.mandate.riskTolerance}</Badge>
                      <span className="text-muted">min {agent.mandate.minScore} · max {num(agent.mandate.maxTicketUsdc)}</span>
                    </span>
                  ) : '—'}
                </td>
                <td className="py-2 pr-3">
                  {view.decision ? <ActionPill action={view.decision.action} size="xs" /> : gateFailed ? <Badge tone="danger">gate ✕</Badge> : view.status === 'running' ? <span className="live-dot text-agent">deciding…</span> : <span className="text-dim">no verdict</span>}
                </td>
                <td className="num py-2 pr-3 text-right text-bright">{view.decision && view.decision.amountUsdc > 0 ? `${num(view.decision.amountUsdc)} USDC` : '—'}</td>
                <td className="num py-2 pr-3 text-right text-accent">{view.decision?.action === 'INVEST' && view.decision.amountUsdc > 0 ? bpsShare(equityShareBps(view.decision.amountUsdc, round.targetUsdc, round.equityBps)) : '—'}</td>
                <td className="py-2 pr-3">{view.decision ? <ConfidenceBar confidence={view.decision.confidence} width="w-16" /> : <span className="text-dim">—</span>}</td>
                <td className="py-2 pr-3 text-muted">{view.decision?.engine ?? '—'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
