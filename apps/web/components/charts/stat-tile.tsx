import type { ReactNode } from 'react';

type StatTileProps = {
  label: string;
  value: string;
  hint?: string;
  delta?: { text: string; tone: 'up' | 'down' | 'flat' };
  viz?: ReactNode; // sparkline / ring, right-aligned
  tone?: 'default' | 'accent' | 'agent' | 'amber';
};

const deltaColor = { up: 'text-accent', down: 'text-danger', flat: 'text-muted' };
const edge = {
  default: 'before:bg-line-strong',
  accent: 'before:bg-chart-accent',
  agent: 'before:bg-chart-agent',
  amber: 'before:bg-chart-warn',
};

// Stat tile: label (sentence case) · value (sans semibold, proportional figures)
// · optional delta · optional tiny viz. A thin colored edge groups tiles by domain.
export function StatTile({ label, value, hint, delta, viz, tone = 'default' }: StatTileProps) {
  return (
    <div
      className={`relative flex min-w-0 items-center justify-between gap-3 overflow-hidden rounded-lg border border-line bg-panel/90 py-3 pl-4 pr-3 before:absolute before:inset-y-0 before:left-0 before:w-[2px] ${edge[tone]}`}
    >
      <div className="min-w-0">
        <p className="eyebrow truncate">{label}</p>
        <p className="mt-1 truncate text-[22px] font-semibold leading-none tracking-tight text-bright">{value}</p>
        <p className="mt-1.5 flex items-center gap-1.5 font-mono text-[10.5px] text-muted">
          {delta && <span className={deltaColor[delta.tone]}>{delta.text}</span>}
          {hint && <span className="truncate">{hint}</span>}
        </p>
      </div>
      {viz && <div className="shrink-0">{viz}</div>}
    </div>
  );
}
