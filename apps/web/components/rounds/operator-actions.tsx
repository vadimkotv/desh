'use client';

import { useRouter } from 'next/navigation';
import { type ReactNode } from 'react';
import { ActionButton } from '@/components/ui/action-button';
import { Button } from '@/components/ui/button';
import { Panel } from '@/components/ui/panel';
import { api } from '@/lib/api';
import { bpsShare } from '@/lib/format';
import type { RoundDetail } from '@/lib/types';
import { ExitForm } from './exit-form';

type OperatorActionsProps = { round: RoundDetail; releasedCount: number };

// Dev/operator controls for the escrow lifecycle. Every call goes on-chain; a
// contract revert comes back as 409 and its `reason` is shown next to the button.
export function OperatorActions({ round, releasedCount }: OperatorActionsProps) {
  const router = useRouter();
  const pastDeadline = new Date(round.deadline).getTime() <= Date.now();
  const canFinalize = round.status === 'OPEN' && (round.raisedUsdc >= round.targetUsdc || pastDeadline);
  const next = round.milestones[releasedCount];
  const allReleased = releasedCount >= round.milestones.length;

  return (
    <Panel eyebrow="operator · dev" title="Escrow lifecycle" tone="amber" action={<span className="font-mono text-[10px] text-dim">on-chain · reverts shown inline</span>}>
      <div className="flex flex-col gap-3">
        <Row label="1 · finalize" hint={canFinalize ? 'raised ≥ target or past deadline' : round.status !== 'OPEN' ? `already ${round.status.toLowerCase()}` : 'needs target or deadline'}>
          {canFinalize ? (
            <ActionButton label="Finalize round" pendingLabel="Finalizing…" variant="primary" size="xs" run={() => api.finalizeRound(round.id)} successText={(r) => `→ ${r.status}`} onSuccess={() => router.refresh()} />
          ) : (
            <Button size="xs" disabled>Finalize round</Button>
          )}
        </Row>
        <Row label="2 · release milestone" hint={allReleased ? `all ${round.milestones.length} released` : `next: ${next?.title ?? '—'} (${releasedCount}/${round.milestones.length})`}>
          {allReleased ? (
            <Button size="xs" disabled>All released</Button>
          ) : (
            <ActionButton label="Release next" pendingLabel="Releasing…" size="xs" run={() => api.releaseMilestone(round.id)} successText={() => 'released'} onSuccess={() => router.refresh()} />
          )}
        </Row>
        <Row label="3 · settle exit" hint={`investors hold ${bpsShare(round.equityBps)} — enter the headline valuation`}>
          <ExitForm roundId={round.id} equityBps={round.equityBps} raisedUsdc={round.raisedUsdc} />
        </Row>
        <Row label="sync" hint="re-read escrow state from Arc">
          <ActionButton label="Sync" size="xs" run={() => api.syncRound(round.id)} successText={(r) => `status ${r.status}`} onSuccess={() => router.refresh()} />
        </Row>
      </div>
    </Panel>
  );
}

function Row({ label, hint, children }: { label: string; hint: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5 border-t border-line pt-3 first:border-0 first:pt-0 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="eyebrow">{label}</p>
        <p className="font-mono text-[10.5px] text-dim">{hint}</p>
      </div>
      {children}
    </div>
  );
}
