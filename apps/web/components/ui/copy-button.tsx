'use client';

import { useState } from 'react';
import { shortAddress } from '@/lib/format';

type CopyButtonProps = { value: string; label?: string; chars?: number };

// Shows a shortened address and copies the full value on click.
export function CopyButton({ value, label, chars = 4 }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      title={value}
      className="inline-flex items-center gap-1.5 rounded border border-line bg-raised px-2 py-0.5 font-mono text-xs text-fg transition hover:border-accent/50 hover:text-accent"
    >
      <span>{label ?? shortAddress(value, chars)}</span>
      <span className={`text-[10px] ${copied ? 'text-accent' : 'text-muted'}`}>{copied ? '✓' : '⧉'}</span>
    </button>
  );
}
