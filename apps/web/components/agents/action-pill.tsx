import type { DecisionAction } from '@agentipo/shared';

const styles: Record<DecisionAction, string> = {
  INVEST: 'border-accent/50 bg-accent/15 text-accent',
  PASS: 'border-line bg-raised text-muted',
  WATCH: 'border-amber/50 bg-amber/15 text-amber',
};

export function ActionPill({ action }: { action: DecisionAction }) {
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-wider ${styles[action]}`}>
      {action}
    </span>
  );
}
