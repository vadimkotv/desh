import Link from 'next/link';
import type { Decision } from '@agentipo/shared';
import { ActionPill } from '@/components/ui/action-pill';
import { Badge } from '@/components/ui/badge';
import { Collapsible } from '@/components/ui/collapsible';
import { ConfidenceBar } from '@/components/ui/confidence-bar';
import { ExternalLink } from '@/components/ui/external-link';
import { formatDate, shortAddress, shortId, usdc } from '@/lib/format';
import { hederaTxUrl, settlementTxUrl } from '@/lib/links';

type DecisionItemProps = { decision: Decision; roundName?: string };

const investmentTone = { CONFIRMED: 'accent', FAILED: 'danger', PENDING: 'amber' } as const;

// One decision on the timeline: verdict, amount, confidence, engine, links, reasoning.
export function DecisionItem({ decision, roundName }: DecisionItemProps) {
  const { investment } = decision;
  const dotTone = decision.action === 'INVEST' ? 'bg-accent' : decision.action === 'WATCH' ? 'bg-amber' : 'bg-line-strong';
  return (
    <li className="relative pl-5">
      <span className={`absolute -left-[5px] top-2 h-2.5 w-2.5 rounded-full border-2 border-panel ${dotTone}`} aria-hidden />
      <article className="flex flex-col gap-2 rounded-lg border border-line bg-panel/90 p-3 transition-colors hover:border-line-strong">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <ActionPill action={decision.action} size="xs" />
            <span className="num text-[14px] font-semibold text-bright">{decision.amountUsdc > 0 ? usdc(decision.amountUsdc) : '—'}</span>
            <Link href={`/rounds/${decision.roundId}`} className="font-mono text-[11px] text-info hover:underline">
              {roundName ?? `round ${shortId(decision.roundId)}`}
            </Link>
            <span className="font-mono text-[10px] text-dim">{decision.engine}</span>
          </div>
          <ConfidenceBar confidence={decision.confidence} />
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[10.5px] text-muted">
          <span className="num text-dim">{formatDate(decision.createdAt)}</span>
          {decision.dataPaymentTxId ? (
            <span className="flex items-center gap-1">x402 <ExternalLink href={hederaTxUrl(decision.dataPaymentTxId)}>hashscan</ExternalLink></span>
          ) : (
            <span>x402 · no payment</span>
          )}
          {investment && (
            <span className="flex items-center gap-1.5">
              settle
              {investment.txHash ? (
                <ExternalLink href={settlementTxUrl(investment.chainId, investment.txHash)}>{shortAddress(investment.txHash, 5)}</ExternalLink>
              ) : (
                <span className="text-dim">no tx</span>
              )}
              <Badge tone={investmentTone[investment.status]} title={investment.error ?? undefined}>{investment.status}</Badge>
            </span>
          )}
        </div>
        {investment?.error && <p className="font-mono text-[10.5px] text-danger">✕ {investment.error}</p>}
        <Collapsible label="reasoning">
          <p className="whitespace-pre-wrap text-[12.5px] leading-relaxed text-fg">{decision.reasoning}</p>
        </Collapsible>
        {decision.keyRisks.length > 0 && (
          <ul className="flex flex-wrap gap-1">
            {decision.keyRisks.map((risk) => (
              <li key={risk} className="rounded-sm border border-danger/30 bg-danger/5 px-1.5 py-[1px] font-mono text-[10px] text-danger">⚠ {risk}</li>
            ))}
          </ul>
        )}
      </article>
    </li>
  );
}
