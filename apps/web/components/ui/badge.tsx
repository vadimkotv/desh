import type { ReactNode } from 'react';

export type BadgeTone = 'neutral' | 'accent' | 'amber' | 'danger' | 'info';

const tones: Record<BadgeTone, string> = {
  neutral: 'border-line bg-raised text-muted',
  accent: 'border-accent/40 bg-accent/10 text-accent',
  amber: 'border-amber/40 bg-amber/10 text-amber',
  danger: 'border-danger/40 bg-danger/10 text-danger',
  info: 'border-info/40 bg-info/10 text-info',
};

type BadgeProps = { tone?: BadgeTone; children: ReactNode; className?: string };

export function Badge({ tone = 'neutral', children, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export const scoreTone = (score: number): BadgeTone =>
  score >= 70 ? 'accent' : score >= 40 ? 'amber' : 'danger';
