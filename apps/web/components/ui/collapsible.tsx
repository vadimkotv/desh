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
        className="inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-wider text-muted hover:text-fg"
      >
        <span className="inline-block w-3 text-accent">{open ? '−' : '+'}</span>
        {label}
      </button>
      {open && <div className="mt-2">{children}</div>}
    </div>
  );
}
