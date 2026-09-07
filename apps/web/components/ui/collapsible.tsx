'use client';

import { useState, type ReactNode } from 'react';

type CollapsibleProps = {
  label: string;
  children: ReactNode;
  defaultOpen?: boolean;
};

export function Collapsible({ label, children, defaultOpen = false }: CollapsibleProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="inline-flex items-center gap-1 font-mono text-[10.5px] uppercase tracking-wider text-muted transition-colors hover:text-fg"
      >
        <span className={`inline-block w-3 text-accent transition-transform ${open ? 'rotate-90' : ''}`}>›</span>
        {label}
      </button>
      {open && <div className="mt-2 fade-in">{children}</div>}
    </div>
  );
}
