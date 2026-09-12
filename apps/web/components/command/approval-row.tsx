'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Agent, Decision } from '@agentipo/shared';
import { ActionButton } from '@/components/ui/action-button';
import { Badge } from '@/components/ui/badge';
import { ConfidenceBar } from '@/components/ui/confidence-bar';
import { RiskList } from '@/components/ui/risk-list';
import { api } from '@/lib/api';
import { bpsShare, equityShareBps, shortId, usdc } from '@/lib/format';
import type { RoundDetail } from '@/lib/types';

type ApprovalRowProps = { proposal: Decision; round?: RoundDetail; agent?: Agent };

export function ApprovalRow({ proposal, round, agent }: ApprovalRowProps) {
  const router = useRouter();
  const refresh = () => router.refresh();
  const stake = round ? equityShareBps(proposal.amountUsdc, round.targetUsdc, round.equityBps) : null;

  return (
    <li className="flex flex-col gap-2 rounded-lg border border-amber/35 bg-amber/[0.04] p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="amber">✋ proposal</Badge>
          <span className="num text-[15px] font-semibold text-bright">{usdc(proposal.amountUsdc)}</span>
          {stake !== null && (
            <span className="num text-[11px] text-accent" title="share of the company this ticket buys if the round fills">
              → {bpsShare(stake)} of the company
            </span>
          )}
          <Link href={`/rounds/${proposal.roundId}`} className="font-mono text-[11px] text-info hover:underline">
            {round?.startup.name ?? `round ${shortId(proposal.roundId)}`}
          </Link>
          {agent && (
            <Link href={`/agents/${agent.id}`} className="font-mono text-[11px] text-agent hover:underline">
              {agent.name}
            </Link>
          )}
          <span className="font-mono text-[10px] text-dim">{proposal.engine}</span>
        </div>
        <ConfidenceBar confidence={proposal.confidence} />
      </div>
      <p className="text-[12.5px] leading-relaxed text-fg">{proposal.reasoning}</p>
      <RiskList risks={proposal.keyRisks} />
      <div className="flex flex-wrap items-center gap-3">
        <ActionButton
          label="Approve & invest"
          pendingLabel="Settling…"
          variant="primary"
          size="xs"
          run={() => api.approveDecision(proposal.id)}
          successText={(d) => (d.investment?.status === 'CONFIRMED' ? `settled ${usdc(d.investment.amountUsdc)}` : 'submitted')}
          onSuccess={refresh}
        />
        <ActionButton
          label="Reject"
          pendingLabel="Rejecting…"
          size="xs"
          run={() => api.rejectDecision(proposal.id)}
          successText={() => 'rejected'}
          onSuccess={refresh}
        />
        <span className="font-mono text-[10px] text-dim">
          re-checked against the mandate, the daily budget and the wallet at approval time
        </span>
      </div>
    </li>
  );
}
