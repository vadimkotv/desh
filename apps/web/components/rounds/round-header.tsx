import { Badge } from '@/components/ui/badge';
import { CopyButton } from '@/components/ui/copy-button';
import { ExternalLink } from '@/components/ui/external-link';
import { ProgressBar } from '@/components/ui/progress-bar';
import { countdown, formatDate, percent, usdc } from '@/lib/format';
import type { RoundDetail } from '@/lib/types';

export function RoundHeader({ round }: { round: RoundDetail }) {
  const { startup } = round;
  const progress = percent(round.raisedUsdc, round.targetUsdc);
  const deadline = countdown(round.deadline);
  return (
    <div className="rounded-lg border border-line bg-panel/90 p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-fg">{startup.name}</h1>
            <Badge tone="info">{startup.sector}</Badge>
            <Badge tone={round.status === 'OPEN' ? 'accent' : 'neutral'}>{round.status}</Badge>
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">{startup.description}</p>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-xs">
            {startup.website && <ExternalLink href={startup.website}>{startup.website}</ExternalLink>}
            <span className="flex items-center gap-1.5 text-muted">
              founder <CopyButton value={startup.founderAddress} />
            </span>
            <span className="flex items-center gap-1.5 text-muted">
              treasury <CopyButton value={startup.treasuryAddress} />
            </span>
          </div>
        </div>
        <div className="w-full md:w-72">
          <div className="flex items-baseline justify-between font-mono text-xs">
            <span className="text-lg font-semibold text-fg">{usdc(round.raisedUsdc)}</span>
            <span className="text-muted">target {usdc(round.targetUsdc)}</span>
          </div>
          <ProgressBar value={progress} tone={progress >= 100 ? 'accent' : 'info'} className="mt-2" />
          <div className="mt-2 flex items-center justify-between font-mono text-[11px]">
            <span className={deadline.expired ? 'text-danger' : 'text-accent'}>⏱ {deadline.label}</span>
            <span className="text-muted">{formatDate(round.deadline)}</span>
          </div>
          <p className="mt-1 font-mono text-[11px] text-muted">min ticket {usdc(round.minTicketUsdc)}</p>
        </div>
      </div>
    </div>
  );
}
