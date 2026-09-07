import Link from 'next/link';
import type { DueDiligencePreview } from '@agentipo/shared';
import { Badge } from '@/components/ui/badge';
import { ProgressBar } from '@/components/ui/progress-bar';
import { countdown, percent, usdc } from '@/lib/format';
import type { RoundDetail } from '@/lib/types';
import { DdScoreBadge } from './dd-score-badge';

type RoundCardProps = { round: RoundDetail; preview: DueDiligencePreview | null };

export function RoundCard({ round, preview }: RoundCardProps) {
  const progress = percent(round.raisedUsdc, round.targetUsdc);
  const deadline = countdown(round.deadline);
  return (
    <Link
      href={`/rounds/${round.id}`}
      className="group flex flex-col gap-4 rounded-lg border border-line bg-panel/90 p-4 transition hover:border-accent/50"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-fg group-hover:text-accent">
            {round.startup.name}
          </h3>
          <p className="mt-0.5 font-mono text-[11px] uppercase tracking-wider text-muted">
            {round.startup.sector}
          </p>
        </div>
        <DdScoreBadge preview={preview} />
      </div>

      <div>
        <div className="mb-1.5 flex items-baseline justify-between font-mono text-xs">
          <span className="text-fg">{usdc(round.raisedUsdc)}</span>
          <span className="text-muted">of {usdc(round.targetUsdc)}</span>
        </div>
        <ProgressBar value={progress} tone={progress >= 100 ? 'accent' : 'info'} />
      </div>

      <div className="flex items-center justify-between font-mono text-[11px]">
        <span className={deadline.expired ? 'text-danger' : 'text-muted'}>⏱ {deadline.label}</span>
        <Badge tone={round.status === 'OPEN' ? 'accent' : 'neutral'}>{round.status}</Badge>
      </div>
    </Link>
  );
}
