import type { Decision } from '@agentipo/shared';
import { Collapsible } from '@/components/ui/collapsible';
import { formatDate, usdc } from '@/lib/format';
import { ActionPill } from './action-pill';
import { ConfidenceBar } from './confidence-bar';
import { DecisionLinks } from './decision-links';

export function DecisionCard({ decision }: { decision: Decision }) {
  return (
    <article className="flex flex-col gap-3 rounded-lg border border-line bg-panel/90 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <ActionPill action={decision.action} />
          <span className="font-mono text-sm font-semibold tabular-nums text-fg">
            {decision.amountUsdc > 0 ? usdc(decision.amountUsdc) : '—'}
          </span>
        </div>
        <ConfidenceBar confidence={decision.confidence} />
      </div>
      <DecisionLinks decision={decision} />
      <Collapsible label="reasoning">
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-fg">{decision.reasoning}</p>
      </Collapsible>
      {decision.keyRisks.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {decision.keyRisks.map((risk) => (
            <li key={risk} className="rounded border border-danger/30 bg-danger/5 px-2 py-0.5 text-[11px] text-danger">
              ⚠ {risk}
            </li>
          ))}
        </ul>
      )}
      <p className="font-mono text-[10px] text-muted">
        engine {decision.engine} · {formatDate(decision.createdAt)}
      </p>
    </article>
  );
}
