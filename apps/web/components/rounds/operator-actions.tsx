'use client';

import { useRouter } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { ActionButton } from '@/components/ui/action-button';
import { Button } from '@/components/ui/button';
import { Panel } from '@/components/ui/panel';
import { api } from '@/lib/api';
import { num } from '@/lib/format';
import type { RoundDetail } from '@/lib/types';

type OperatorActionsProps = { round: RoundDetail; releasedCount: number; capUsdc: number };

// Dev/operator controls for the escrow lifecycle. Every call goes on-chain; a
// contract revert comes back as 409 and its `reason` is shown next to the button.
export function OperatorActions({ round, releasedCount, capUsdc }: OperatorActionsProps) {
  const router = useRouter();
  const remaining = Math.max(0, capUsdc - round.distributedUsdc);
  const [amount, setAmount] = useState(remaining > 0 ? Number(remaining.toFixed(6)) : 0);
  const [dist, setDist] = useState<{ busy: boolean; text: string | null; error: boolean }>({ busy: false, text: null, error: false });
  const pastDeadline = new Date(round.deadline).getTime() <= Date.now();
  const canFinalize = round.status === 'OPEN' && (round.raisedUsdc >= round.targetUsdc || pastDeadline);
  const next = round.milestones[releasedCount];
  const allReleased = releasedCount >= round.milestones.length;

  async function distribute() {
    setDist({ busy: true, text: null, error: false });
    const result = await api.distribute(round.id, amount);
    if (!result.ok) return setDist({ busy: false, text: result.error, error: true });
    setDist({ busy: false, text: `distributed ${num(amount)} USDC · ${result.data.status}`, error: false });
    router.refresh();
  }

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
        <Row label="3 · distribute revenue" hint={`remaining to cap ${num(remaining)} USDC`}>
          <span className="inline-flex flex-wrap items-center gap-2">
            <input
              type="number"
              min={0}
              step="any"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-28 rounded-md border border-line bg-ink px-2 py-1 font-mono text-[11px] text-fg outline-none focus:border-amber/60"
              aria-label="amount in USDC"
            />
            <Button size="xs" variant="primary" busy={dist.busy} onClick={distribute} disabled={amount <= 0}>Distribute</Button>
            {dist.text && <span className={`font-mono text-[10px] ${dist.error ? 'text-danger' : 'text-accent'}`}>{dist.text}</span>}
          </span>
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
