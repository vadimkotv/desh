import type { DecisionAction } from '@agentipo/shared';

const styles: Record<DecisionAction, string> = {
  INVEST: 'border-accent/50 bg-accent/15 text-accent',
  PASS: 'border-line-strong bg-raised text-muted',
  WATCH: 'border-amber/50 bg-amber/15 text-amber',
};

const glyph: Record<DecisionAction, string> = { INVEST: '▲', PASS: '–', WATCH: '◔' };

type ActionPillProps = { action: DecisionAction; size?: 'xs' | 'sm' };

// Decision verdict pill. Carries a glyph so the action is never color-alone.
export function ActionPill({ action, size = 'sm' }: ActionPillProps) {
  const pad = size === 'xs' ? 'px-1.5 py-[1px] text-[10px]' : 'px-2.5 py-0.5 text-[11px]';
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border font-mono font-semibold uppercase tracking-wider ${pad} ${styles[action]}`}>
      <span aria-hidden className="text-[9px]">{glyph[action]}</span>
      {action}
    </span>
  );
}
