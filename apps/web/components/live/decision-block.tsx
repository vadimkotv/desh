import { ActionPill } from '@/components/ui/action-pill';
import { ConfidenceBar } from '@/components/ui/confidence-bar';
import { num } from '@/lib/format';
import type { RunDecision } from '@/lib/run-state';

// The "engine.decided" moment: action pill, amount, confidence and the reasoning
// typed in. Used by run cards on the command center and the round swarm panel.
export function DecisionBlock({ decision }: { decision: RunDecision }) {
  return (
    <div className="rise-in rounded-md border border-agent/30 bg-agent/5 p-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ActionPill action={decision.action} size="xs" />
          <span className="num text-[13px] font-semibold text-bright">
            {decision.amountUsdc > 0 ? `${num(decision.amountUsdc)} USDC` : '—'}
          </span>
          <span className="font-mono text-[10px] text-dim">{decision.engine}</span>
        </div>
        <ConfidenceBar confidence={decision.confidence} />
      </div>
      <p className="typewriter mt-1.5 text-[11.5px] leading-relaxed text-fg">{decision.reasoning}</p>
      {decision.keyRisks.length > 0 && (
        <ul className="mt-1.5 flex flex-wrap gap-1">
          {decision.keyRisks.map((risk) => (
            <li key={risk} className="rounded-sm border border-danger/30 bg-danger/5 px-1.5 py-[1px] font-mono text-[10px] text-danger">
              ⚠ {risk}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
