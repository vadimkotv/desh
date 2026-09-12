'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { Agent } from '@agentipo/shared';
import { AGENT_RUNTIME_EVENT } from '@/lib/agent-runtime-events';
import { api } from '@/lib/api';

const REFRESH_MS = 4_000;

export function ActiveAgentStatus() {
  const [agents, setAgents] = useState<Agent[]>([]);

  useEffect(() => {
    const refresh = async () => {
      const result = await api.agents();
      if (result.ok) setAgents(result.data);
    };
    const update = (event: Event) => {
      const agent = (event as CustomEvent<Agent>).detail;
      setAgents((current) => [agent, ...current.filter((item) => item.id !== agent.id)]);
    };
    void refresh();
    const timer = window.setInterval(() => void refresh(), REFRESH_MS);
    window.addEventListener(AGENT_RUNTIME_EVENT, update);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener(AGENT_RUNTIME_EVENT, update);
    };
  }, []);

  const running = agents.filter((agent) => agent.status === 'RUNNING');
  const active = running[0];
  const label = running.length === 1 && active ? active.name : `${running.length} agents`;
  return (
    <Link
      href={running.length === 1 && active ? `/agents/${active.id}` : '/agents'}
      title={
        running.length
          ? `${running.map((agent) => agent.name).join(', ')} running`
          : 'All agents paused'
      }
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
