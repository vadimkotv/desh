'use client';

import { useState } from 'react';
import { shortAddress } from '@/lib/format';

type CopyButtonProps = { value: string; label?: string; chars?: number; className?: string };

// Shows a shortened address and copies the full value on click.
export function CopyButton({ value, label, chars = 4, className = '' }: CopyButtonProps) {
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
      className={`inline-flex items-center gap-1.5 rounded-sm border border-line bg-raised px-1.5 py-[1px] font-mono text-[11px] text-fg transition-colors hover:border-accent/50 hover:text-accent ${className}`}
    >
      <span>{label ?? shortAddress(value, chars)}</span>
      <span className={`text-[10px] ${copied ? 'text-accent' : 'text-dim'}`}>{copied ? '✓' : '⧉'}</span>
    </button>
  );
}
