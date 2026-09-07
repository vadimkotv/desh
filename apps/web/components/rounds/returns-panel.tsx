import { capMultiplier, type Distribution, type RoundReturns } from '@agentipo/shared';
import { Meter } from '@/components/charts/meter';
import { Badge } from '@/components/ui/badge';
import { ExternalLink } from '@/components/ui/external-link';
import { Panel } from '@/components/ui/panel';
import { formatDate, num, ratioToPercent, usdc } from '@/lib/format';
import { settlementTxUrl } from '@/lib/links';
import { ReturnsTable } from './returns-table';

type ReturnsPanelProps = { returns: RoundReturns | null; distributions: Distribution[]; chainId: number };

// Revenue-based financing: revenue is routed into escrow and investors claim
// pro-rata up to the cap. Shows cap, progress to cap, distributions and claims.
export function ReturnsPanel({ returns, distributions, chainId }: ReturnsPanelProps) {
  if (!returns) {
    return (
      <Panel eyebrow="revenue share" title="Returns">
        <p className="text-[12px] text-muted">Returns are tracked once the round has an on-chain escrow.</p>
      </Panel>
    );
  }
  const repaid = Math.min(1, Math.max(0, returns.repaidShare));
  return (
    <Panel
      eyebrow="revenue share · repaid from escrow"
      title="Returns"
      tone="accent"
      action={<Badge tone="amber">{capMultiplier(returns.returnCapBps)} cap</Badge>}
      bodyClassName="p-0"
    >
      <div className="grid gap-4 border-b border-line p-4 md:grid-cols-[1fr_auto]">
        <div>
          <div className="flex items-baseline justify-between font-mono text-[10.5px] text-muted">
            <span>
              distributed <span className="text-bright">{usdc(returns.distributedUsdc)}</span> of cap{' '}
              <span className="text-fg">{usdc(returns.capUsdc)}</span>
            </span>
            <span className="text-fg">{ratioToPercent(repaid)}</span>
          </div>
          <Meter value={repaid * 100} tone={repaid >= 1 ? 'accent' : 'warn'} className="mt-1.5" height={6} />
          <p className="mt-1.5 font-mono text-[10px] text-dim">
            raised {num(returns.raisedUsdc)} × {capMultiplier(returns.returnCapBps)} = {num(returns.capUsdc)} USDC owed to investors · status {returns.status}
          </p>
        </div>
        <div className="min-w-[220px]">
          <p className="eyebrow mb-1">distributions</p>
          {distributions.length === 0 ? (
            <p className="font-mono text-[10.5px] text-dim">none yet</p>
          ) : (
            <ul className="flex flex-col gap-1 font-mono text-[10.5px]">
              {[...distributions].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-3">
                  <span className="num text-bright">+{num(d.amountUsdc)} USDC</span>
                  <span className="text-dim" title={d.source}>{formatDate(d.createdAt).slice(5, 16)}</span>
                  {d.txHash ? <ExternalLink href={settlementTxUrl(chainId, d.txHash)}>arcscan</ExternalLink> : <span className="text-dim">no tx</span>}
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
