'use client';

import { useState } from 'react';
import type { AgentStatus } from '@agentipo/shared';
import { Button } from '@/components/ui/button';
import { Panel } from '@/components/ui/panel';
import { announceAgentRuntime } from '@/lib/agent-runtime-events';
import { api } from '@/lib/api';

type AgentConsoleProps = { agentId: string; initialStatus: AgentStatus };

export function AgentConsole({ agentId, initialStatus }: AgentConsoleProps) {
  const [status, setStatus] = useState(initialStatus);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    setError(null);
    const result =
      status === 'RUNNING' ? await api.pauseAgent(agentId) : await api.runAgent(agentId);
    setBusy(false);
    if (!result.ok) return setError(`${result.status || 'offline'} · ${result.error}`);
    setStatus(result.data.status);
    announceAgentRuntime(result.data);
  }

  return (
    <Panel
      eyebrow="autonomous runtime · discover → research → decide"
      title={status === 'RUNNING' ? 'Running' : 'Paused'}
      tone="agent"
      action={
        <Button variant={status === 'RUNNING' ? 'danger' : 'agent'} busy={busy} onClick={toggle}>
          {status === 'RUNNING' ? 'Ⅱ Pause agent' : '▶ Run agent'}
        </Button>
      }
    >
      {error && <p className="mb-2 font-mono text-[11px] text-danger">{error}</p>}
      <p className="text-[12px] text-muted">
        {status === 'RUNNING'
          ? 'Watching for new open rounds in this mandate’s sectors. Matching startups are researched automatically in the background.'
          : 'No new research will start while paused. Any evaluation already in progress is allowed to finish safely.'}
      </p>
    </Panel>
  );
}
