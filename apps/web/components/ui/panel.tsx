import type { ReactNode } from 'react';

type PanelProps = {
  title?: string;
  eyebrow?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
};

// The one container used across the dashboard: hairline border, dark surface,
// optional monospace eyebrow + title header row.
export function Panel({ title, eyebrow, action, children, className = '' }: PanelProps) {
  return (
    <section className={`rounded-lg border border-line bg-panel/90 backdrop-blur ${className}`}>
      {(title || eyebrow || action) && (
        <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
          <div>
            {eyebrow && (
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">{eyebrow}</p>
            )}
            {title && <h2 className="text-sm font-semibold text-fg">{title}</h2>}
          </div>
          {action}
        </header>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}
