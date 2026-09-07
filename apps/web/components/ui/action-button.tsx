'use client';

import { useState } from 'react';
import type { ApiResult } from '@/lib/types';
import { Button, type ButtonSize, type ButtonVariant } from './button';

export type ActionStatus = { tone: 'ok' | 'error' | 'pending'; text: string } | null;

type ActionButtonProps<T> = {
  label: string;
  pendingLabel?: string;
  run: () => Promise<ApiResult<T>>;
  onSuccess?: (data: T) => void | Promise<void>;
  successText?: (data: T) => string;
  variant?: ButtonVariant;
  size?: ButtonSize;
};

// A POST trigger with inline "toast": status text lives next to the button
// so it works without any global state or portals.
export function ActionButton<T>(props: ActionButtonProps<T>) {
  const { label, pendingLabel = 'Working…', run, onSuccess, successText, variant = 'ghost', size } = props;
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
      <Button onClick={handle} busy={busy} variant={variant} size={size}>
        {busy ? pendingLabel : label}
      </Button>
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
