import type { ReactNode } from 'react';

type KeyValueProps = { label: string; children: ReactNode };

// Compact definition row used in header cards and on-chain panels.
export function KeyValue({ label, children }: KeyValueProps) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <dt className="font-mono text-[11px] uppercase tracking-wider text-muted">{label}</dt>
      <dd className="font-mono text-xs text-fg">{children}</dd>
    </div>
  );
}

export function KeyValueList({ children }: { children: ReactNode }) {
  return <dl className="flex flex-col gap-2">{children}</dl>;
}
