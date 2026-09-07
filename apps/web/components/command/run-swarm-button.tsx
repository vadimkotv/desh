'use client';

import { useState } from 'react';
import { Button, type ButtonSize } from '@/components/ui/button';
import { api } from '@/lib/api';
import type { SwarmRun } from '@/lib/api-types';

type RunSwarmButtonProps = {
  roundId: string;
  size?: ButtonSize;
  onStarted?: (runs: SwarmRun[]) => void;
  label?: string;
};

// POST /rounds/:id/swarm — every agent evaluates the same round concurrently.
// On the command center the firehose picks the runs up; on the round page the
// parent subscribes to each run individually via onStarted.
export function RunSwarmButton({ roundId, size = 'xs', onStarted, label = 'Run swarm' }: RunSwarmButtonProps) {
  const [state, setState] = useState<{ busy: boolean; text: string | null; error: boolean }>({ busy: false, text: null, error: false });

  async function start() {
    setState({ busy: true, text: null, error: false });
    const result = await api.swarm(roundId);
    if (!result.ok) {
      setState({ busy: false, text: `${result.status || 'offline'} · ${result.error}`, error: true });
      return;
    }
    setState({ busy: false, text: `${result.data.runs.length} agents launched`, error: false });
    onStarted?.(result.data.runs);
    setTimeout(() => setState((s) => ({ ...s, text: null })), 4000);
  }

  return (
    <span className="inline-flex items-center gap-2">
      <Button variant="agent" size={size} busy={state.busy} onClick={start}>
        <span aria-hidden>⇶</span> {state.busy ? 'Launching…' : label}
      </Button>
      {state.text && <span className={`font-mono text-[10px] ${state.error ? 'text-danger' : 'text-accent'}`}>{state.text}</span>}
    </span>
  );
}
