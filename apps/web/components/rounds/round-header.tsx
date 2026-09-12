import { Meter } from '@/components/charts/meter';
import { Badge, roundStatusTone } from '@/components/ui/badge';
import { CopyButton } from '@/components/ui/copy-button';
import { StartupLinks } from '@/components/startups/startup-links';
import { bpsShare, countdown, formatDate, percent, usdc, usdcCompact } from '@/lib/format';
import { entryValuation } from '@agentipo/shared';
import type { RoundDetail } from '@/lib/types';

export function RoundHeader({ round }: { round: RoundDetail }) {
  const { startup } = round;
  const progress = percent(round.raisedUsdc, round.targetUsdc);
  const deadline = countdown(round.deadline);
  return (
    <div className="rounded-lg border border-line bg-panel/90 p-5">
      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 flex-1">
          <p className="eyebrow text-accent">round · {round.id.slice(0, 8)}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-bright">{startup.name}</h1>
            <Badge tone="info">{startup.sector}</Badge>
            <Badge tone={roundStatusTone[round.status]}>{round.status}</Badge>
            {round.escrowAddress && <Badge tone="accent">⛓ on-chain #{round.onchainRoundId}</Badge>}
            <Badge tone="amber" title="stake sold by this round — investors are paid pro-rata when the startup exits">{bpsShare(round.equityBps)} equity</Badge>
          </div>
          <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-muted">{startup.description}</p>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[11px]">
            <span className="flex items-center gap-1.5 text-muted">
              founder <CopyButton value={startup.founderAddress} />
            </span>
            <span className="flex items-center gap-1.5 text-muted">
              treasury <CopyButton value={startup.treasuryAddress} />
            </span>
            {startup.tokenAddress && (
              <span className="flex items-center gap-1.5 text-muted">
                token <CopyButton value={startup.tokenAddress} /> <span className="text-dim">{startup.tokenNetwork}</span>
              </span>
            )}
            <StartupLinks startup={startup} />
          </div>
        </div>
        <div className="w-full shrink-0 rounded-md border border-line bg-raised/60 p-3 md:w-72">
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-semibold tracking-tight text-bright">{usdc(round.raisedUsdc)}</span>
            <span className="font-mono text-[10.5px] text-muted">{Math.round(progress)}%</span>
          </div>
          <p className="font-mono text-[10.5px] text-muted">target {usdc(round.targetUsdc)} · min ticket {usdc(round.minTicketUsdc)}</p>
          <p className="font-mono text-[10.5px] text-dim">
            {bpsShare(round.equityBps)} equity · {usdcCompact(entryValuation(round.targetUsdc, round.equityBps))} valuation at target
          </p>
          <Meter value={progress} tone={progress >= 100 ? 'accent' : 'info'} className="mt-2" height={5} />
          <div className="mt-2 flex items-center justify-between font-mono text-[10.5px]">
            <span className={deadline.expired ? 'text-danger' : 'text-accent'}>⏱ {deadline.label}{!deadline.expired && ' left'}</span>
            <span className="text-dim">{formatDate(round.deadline)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
