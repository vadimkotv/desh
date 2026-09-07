'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { RunLive } from '@/components/live/run-live';
import { Button } from '@/components/ui/button';
import { Panel } from '@/components/ui/panel';
import { api } from '@/lib/api';
import type { RunView } from '@/lib/run-state';

type AgentConsoleProps = { agentId: string; agentName: string };

// "Run agent" → POST /agents/:id/runs → live stepper for that run; the page
// refreshes once the run completes so the decisions timeline picks it up.
export function AgentConsole({ agentId, agentName }: AgentConsoleProps) {
  const router = useRouter();
  const [runId, setRunId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const onView = useCallback(
    (view: RunView) => {
      if (view.status !== 'running') router.refresh();
    },
    [router],
  );

  async function start() {
    setBusy(true);
    setError(null);
    const result = await api.startRun(agentId);
    setBusy(false);
    if (!result.ok) return setError(`${result.status || 'offline'} · ${result.error}`);
    setRunId(result.data.runId);
  }

  return (
    <Panel
      eyebrow="pipeline · buy data → gate → policy → decide → settle"
      title="Console"
      tone="agent"
      action={
        <Button variant="agent" busy={busy} onClick={start}>
          ▶ {runId ? 'Run again' : 'Run agent'}
        </Button>
      }
    >
      {error && <p className="mb-2 font-mono text-[11px] text-danger">{error}</p>}
      {runId ? (
        <RunLive runId={runId} agentName={agentName} onView={onView} />
      ) : (
        <p className="text-[12px] text-muted">
          Runs the full loop over every open round in this agent’s sectors. Each step streams here as it happens.
        </p>
      )}
    </Panel>
  );
}
