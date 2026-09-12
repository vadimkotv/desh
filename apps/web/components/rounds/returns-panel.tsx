import { EXIT_LABELS, formatMultiple, type ExitEvent, type RoundReturns } from '@agentipo/shared';
import { Badge } from '@/components/ui/badge';
import { ExternalLink } from '@/components/ui/external-link';
import { Panel } from '@/components/ui/panel';
import { bpsShare, formatDate, num, usdcCompact } from '@/lib/format';
import { settlementTxUrl } from '@/lib/links';
import { ReturnsTable } from './returns-table';

type ReturnsPanelProps = { returns: RoundReturns | null; exits: ExitEvent[]; chainId: number };

// Exit-based returns: nothing comes back until a liquidity event is settled into the
// escrow, then investors claim pro-rata. Shows entry price, the exits and the claims.
export function ReturnsPanel({ returns, exits, chainId }: ReturnsPanelProps) {
  if (!returns) {
    return (
      <Panel eyebrow="exit returns" title="Returns">
        <p className="text-[12px] text-muted">Returns are tracked once the round has an on-chain escrow.</p>
      </Panel>
    );
  }
  const exited = returns.proceedsUsdc > 0;
  return (
    <Panel
      eyebrow="exit returns · claimed from escrow"
      title="Returns"
      tone="accent"
      action={<Badge tone={exited ? 'accent' : 'neutral'}>{formatMultiple(returns.multiple)}</Badge>}
      bodyClassName="p-0"
    >
      <div className="grid gap-4 border-b border-line p-4 md:grid-cols-[1fr_auto]">
        <div className="grid grid-cols-3 gap-3">
          <Stat label="bought" value={bpsShare(returns.equityBps)} hint={`for ${usdcCompact(returns.raisedUsdc)}`} />
          <Stat label="entry valuation" value={usdcCompact(returns.entryValuationUsdc)} hint="raised ÷ stake" />
          <Stat
            label="exit proceeds"
            value={exited ? usdcCompact(returns.proceedsUsdc) : '—'}
            hint={exited ? `${formatMultiple(returns.multiple)} on capital` : 'no exit yet'}
            tone={exited ? 'text-accent' : 'text-dim'}
          />
        </div>
        <div className="min-w-[220px]">
          <p className="eyebrow mb-1">liquidity events</p>
          {exits.length === 0 ? (
            <p className="font-mono text-[10.5px] text-dim">
              none yet — capital returns on an acquisition, IPO, TGE or contract payout
            </p>
          ) : (
            <ul className="flex flex-col gap-1 font-mono text-[10.5px]">
              {[...exits].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((e) => (
                <li key={e.id} className="flex items-center justify-between gap-3">
                  <span className="num text-bright" title={EXIT_LABELS[e.kind]}>
                    +{num(e.proceedsUsdc)} <span className="text-muted">{e.kind.toLowerCase()}</span>
                  </span>
                  <span className="text-dim">{formatDate(e.createdAt).slice(5, 16)}</span>
                  {e.txHash ? <ExternalLink href={settlementTxUrl(chainId, e.txHash)}>arcscan</ExternalLink> : <span className="text-dim">no tx</span>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <ReturnsTable roundId={returns.roundId} investors={returns.investors} />
    </Panel>
  );
}

function Stat({ label, value, hint, tone = 'text-bright' }: { label: string; value: string; hint: string; tone?: string }) {
  return (
    <div>
      <p className="eyebrow">{label}</p>
      <p className={`num text-[15px] font-semibold ${tone}`}>{value}</p>
      <p className="font-mono text-[10px] text-dim">{hint}</p>
    </div>
  );
}
