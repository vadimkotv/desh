import type { ReactNode } from 'react';

export type BadgeTone = 'neutral' | 'accent' | 'agent' | 'amber' | 'danger' | 'info';

const tones: Record<BadgeTone, string> = {
  neutral: 'border-line-strong bg-raised text-muted',
  accent: 'border-accent/35 bg-accent/10 text-accent',
  agent: 'border-agent/35 bg-agent/10 text-agent',
  amber: 'border-amber/35 bg-amber/10 text-amber',
  danger: 'border-danger/35 bg-danger/10 text-danger',
  info: 'border-info/35 bg-info/10 text-info',
};

type BadgeProps = { tone?: BadgeTone; children: ReactNode; className?: string; title?: string };

export function Badge({ tone = 'neutral', children, className = '', title }: BadgeProps) {
  return (
    <span
      title={title}
      className={`inline-flex items-center gap-1 rounded-sm border px-1.5 py-[1px] font-mono text-[10px] uppercase tracking-wider ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export const scoreTone = (score: number): BadgeTone =>
  score >= 70 ? 'accent' : score >= 40 ? 'amber' : 'danger';

export const scoreColor = (score: number): string =>
  score >= 70 ? 'var(--color-chart-accent)' : score >= 40 ? 'var(--color-chart-warn)' : 'var(--color-chart-danger)';

export const roundStatusTone: Record<'OPEN' | 'FUNDED' | 'FAILED' | 'CLOSED' | 'REPAID', BadgeTone> = {
  OPEN: 'accent',
  FUNDED: 'info',
  FAILED: 'danger',
  CLOSED: 'agent',
  REPAID: 'accent',
};
