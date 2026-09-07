'use client';

import { useState } from 'react';
import type { ApiResult } from '@/lib/types';

export type ActionStatus = { tone: 'ok' | 'error' | 'pending'; text: string } | null;

type ActionButtonProps<T> = {
  label: string;
  pendingLabel?: string;
  run: () => Promise<ApiResult<T>>;
  onSuccess?: (data: T) => void | Promise<void>;
  successText?: (data: T) => string;
  variant?: 'primary' | 'ghost';
};

const variants = {
  primary: 'border-accent/60 bg-accent/10 text-accent hover:bg-accent/20',
  ghost: 'border-line bg-raised text-fg hover:border-accent/50 hover:text-accent',
};

// A POST trigger with inline "toast": status text lives next to the button
// so it works without any global state or portals.
export function ActionButton<T>(props: ActionButtonProps<T>) {
  const { label, pendingLabel = 'Working…', run, onSuccess, successText, variant = 'ghost' } = props;
  const [status, setStatus] = useState<ActionStatus>(null);
  const busy = status?.tone === 'pending';

  async function handle() {
    setStatus({ tone: 'pending', text: pendingLabel });
    const result = await run();
    if (!result.ok) {
      setStatus({ tone: 'error', text: `${result.status || 'offline'} · ${result.error}` });
      return;
    }
    setStatus({ tone: 'ok', text: successText ? successText(result.data) : 'done' });
    await onSuccess?.(result.data);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={handle}
        disabled={busy}
        className={`rounded border px-3 py-1.5 font-mono text-xs transition disabled:cursor-wait disabled:opacity-60 ${variants[variant]}`}
      >
        {busy ? pendingLabel : label}
      </button>
      {status && <InlineStatus status={status} />}
    </div>
  );
}

export function InlineStatus({ status }: { status: NonNullable<ActionStatus> }) {
  const color =
    status.tone === 'ok' ? 'text-accent' : status.tone === 'error' ? 'text-danger' : 'text-muted';
  return (
    <span className={`font-mono text-[11px] ${color}`} role="status">
      {status.tone === 'pending' && <span className="live-dot mr-1">●</span>}
      {status.text}
    </span>
  );
}
