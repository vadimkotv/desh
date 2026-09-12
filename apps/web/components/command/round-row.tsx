import Link from 'next/link';
import { Meter } from '@/components/charts/meter';
import { Ring } from '@/components/charts/ring';
import { Badge, roundStatusTone } from '@/components/ui/badge';
import { bpsShare, countdown, percent, usdcCompact } from '@/lib/format';
import type { ReviewState, ReviewWatcher } from '@agentipo/shared';
import type { RoundDetail } from '@/lib/types';
import { RunSwarmButton } from './run-swarm-button';

type RoundRowProps = {
  round: RoundDetail;
  score: number | null;
  state?: ReviewState;
  watchers?: ReviewWatcher[];
};

const stateTone = { WAITING: 'agent', REVIEWED: 'info', INVESTED: 'accent' } as const;

// Compact open-round card for the command center's left rail.
export function RoundRow({ round, score, state, watchers = [] }: RoundRowProps) {
  const progress = percent(round.raisedUsdc, round.targetUsdc);
  const deadline = countdown(round.deadline);
  return (
    <article className="group flex flex-col gap-2.5 rounded-lg border border-line bg-panel/90 p-3 transition-colors hover:border-accent/40">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <Link
            href={`/rounds/${round.id}`}
            className="block truncate text-[13px] font-semibold text-bright group-hover:text-accent"
          >
            {round.startup.name}
          </Link>
          <div className="mt-1 flex flex-wrap items-center gap-1">
            <Badge tone="info">{round.startup.sector}</Badge>
            {round.status !== 'OPEN' && (
              <Badge tone={roundStatusTone[round.status]}>{round.status}</Badge>
            )}
            <Badge tone="amber" title="stake sold by this round">
              {bpsShare(round.equityBps)} equity
            </Badge>
            {round.escrowAddress ? (
              <Badge tone="accent" title={round.escrowAddress}>
                ⛓ on-chain #{round.onchainRoundId}
              </Badge>
            ) : (
              <Badge tone="neutral">off-chain</Badge>
            )}
          </div>
        </div>
        {score !== null ? (
          <Ring value={score} size={40} stroke={4} />
        ) : (
          <span
            className="flex h-10 w-10 items-center justify-center rounded-full border border-dashed border-line-strong font-mono text-[9px] text-dim"
            title="no DD report yet"
          >
            n/a
          </span>
        )}
      </div>
      <div>
        <div className="mb-1 flex items-baseline justify-between font-mono text-[10.5px]">
          <span className="text-fg">{usdcCompact(round.raisedUsdc)}</span>
          <span className="text-muted">of {usdcCompact(round.targetUsdc)}</span>
        </div>
        <Meter value={progress} tone={progress >= 100 ? 'accent' : 'info'} height={3} />
      </div>
      <div className="flex items-center justify-between">
        <span className={`num text-[10.5px] ${deadline.expired ? 'text-danger' : 'text-muted'}`}>
          ⏱ {deadline.label}
          {!deadline.expired && ' left'}
        </span>
        {state ? (
          <Badge tone={stateTone[state]} title={watchers.map((w) => w.agentName).join(', ') || undefined}>
            {state === 'WAITING' && <span className="live-dot">●</span>}
            {state}
            {watchers.length > 0 && <span className="text-dim">· {watchers.length}</span>}
          </Badge>
        ) : round.status === 'OPEN' ? (
          <RunSwarmButton roundId={round.id} />
        ) : (
          <span className="num text-[10.5px] text-muted">
            {round.proceedsUsdc > 0 ? `exit ${usdcCompact(round.proceedsUsdc)}` : 'awaiting exit'}
          </span>
        )}
      </div>
    </article>
  );
}
