import type { ReactNode } from 'react';

type PanelProps = {
  title?: string;
  eyebrow?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  tone?: 'default' | 'accent' | 'agent' | 'amber';
};

const toneBorder = {
  default: 'border-line',
  accent: 'border-accent/30',
  agent: 'border-agent/30',
  amber: 'border-amber/30',
};

// The one container used across the dashboard: hairline border, dark surface,
// optional monospace eyebrow + title header row with an action slot.
export function Panel({ title, eyebrow, action, children, className = '', bodyClassName = 'p-4', tone = 'default' }: PanelProps) {
  return (
    <section className={`flex flex-col rounded-lg border bg-panel/90 ${toneBorder[tone]} ${className}`}>
      {(title || eyebrow || action) && (
        <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-2.5">
          <div className="min-w-0">
            {eyebrow && <p className="eyebrow">{eyebrow}</p>}
            {title && <h2 className="truncate text-[13px] font-semibold text-bright">{title}</h2>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </header>
      )}
      <div className={`min-h-0 flex-1 ${bodyClassName}`}>{children}</div>
    </section>
  );
}

// Uppercase mono label used as a column / section heading outside panels.
export function SectionLabel({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-2 flex items-center justify-between gap-2">
      <h2 className="eyebrow text-fg">{children}</h2>
      {right && <span className="font-mono text-[10.5px] text-muted">{right}</span>}
    </div>
  );
}
