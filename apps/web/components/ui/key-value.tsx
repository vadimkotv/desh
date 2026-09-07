import type { ReactNode } from 'react';

type KeyValueProps = { label: string; children: ReactNode };

// Compact definition row used in header cards and on-chain panels.
export function KeyValue({ label, children }: KeyValueProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-1.5">
      <dt className="eyebrow">{label}</dt>
      <dd className="num text-right text-[11.5px] text-fg">{children}</dd>
    </div>
  );
}

export function KeyValueList({ children }: { children: ReactNode }) {
  return <dl className="flex flex-col divide-y divide-line">{children}</dl>;
}
