'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { Agent } from '@agentipo/shared';
import { AGENT_RUNTIME_EVENT } from '@/lib/agent-runtime-events';
import { api, sseUrl } from '@/lib/api';
import { subscribeRunEvents } from '@/lib/sse';

type Running = { id: string; name: string };

// Which agents are working right now. Initial state comes from one /agents read;
// after that the SSE firehose announces every start/pause, so there is no polling
// loop running next to the stream the rest of the dashboard already listens to.
export function ActiveAgentStatus() {
  const [running, setRunning] = useState<Running[]>([]);

  useEffect(() => {
    let disposed = false;
    const apply = (agent: Running, isRunning: boolean) =>
      setRunning((current) => {
        const without = current.filter((item) => item.id !== agent.id);
        return isRunning ? [agent, ...without] : without;
      });

    void api.agents().then((result) => {
      if (disposed || !result.ok) return;
      setRunning(result.data.filter((a) => a.status === 'RUNNING').map((a) => ({ id: a.id, name: a.name })));
    });

    const unsubscribe = subscribeRunEvents(sseUrl.firehose(), {
      closeOnCompleted: false,
      onEvent: (event) => {
        if (event.type !== 'agent.started' && event.type !== 'agent.paused') return;
        const name = typeof event.payload.name === 'string' ? event.payload.name : event.agentId.slice(0, 8);
        apply({ id: event.agentId, name }, event.type === 'agent.started');
      },
    });
    const onLocal = (e: Event) => {
      const agent = (e as CustomEvent<Agent>).detail;
      apply({ id: agent.id, name: agent.name }, agent.status === 'RUNNING');
    };
    window.addEventListener(AGENT_RUNTIME_EVENT, onLocal);
    return () => {
      disposed = true;
      unsubscribe();
      window.removeEventListener(AGENT_RUNTIME_EVENT, onLocal);
    };
  }, []);

  const active = running[0];
  const label = running.length === 1 && active ? active.name : `${running.length} agents`;
  return (
    <Link
      href={running.length === 1 && active ? `/agents/${active.id}` : '/agents'}
      title={running.length ? `${running.map((a) => a.name).join(', ')} running` : 'All agents paused'}
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-md border px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider ${
        running.length ? 'border-agent/35 bg-agent/10 text-agent' : 'border-line bg-panel text-dim'
      }`}
    >
      <span className={running.length ? 'live-dot text-agent' : 'text-dim'}>●</span>
      <span className="hidden xl:inline">{running.length ? `${label} · ` : ''}</span>
      {running.length ? 'agent · on' : 'agent · off'}
    </Link>
  );
}
