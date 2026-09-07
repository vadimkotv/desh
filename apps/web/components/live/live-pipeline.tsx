'use client';

import { useMemo } from 'react';
import type { Agent, RunEvent } from '@agentipo/shared';
import { LiveDot } from '@/components/ui/pill';
import { usePacedRuns } from '@/hooks/use-paced-runs';
import { sseUrl } from '@/lib/api';
import { RunCard } from './run-card';

type LivePipelineProps = { agents: Agent[]; limit?: number; seed?: RunEvent[][] };

// Seeded with recent runs (GET /runs), then subscribed to the /events firehose;
// renders the last N runs, newest first.
export function LivePipeline({ agents, limit = 8, seed = [] }: LivePipelineProps) {
  const url = useMemo(() => sseUrl.firehose(), []);
  const { runs, status } = usePacedRuns(url, limit, seed);
  const names = useMemo(() => new Map(agents.map((a) => [a.id, a.name])), [agents]);
  const running = runs.filter((r) => r.status === 'running').length;

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex items-center justify-between">
        <h2 className="eyebrow text-fg">Live pipeline</h2>
        <div className="flex items-center gap-3 font-mono text-[10.5px] text-muted">
          {running > 0 && <span className="text-agent">{running} running</span>}
          <LiveDot on={status === 'open'} label={status === 'open' ? 'stream open' : status} />
        </div>
      </div>
      {runs.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-line-strong px-6 py-14 text-center">
          <span className="live-dot text-2xl text-agent">◎</span>
          <p className="font-mono text-xs text-fg">Waiting for agents…</p>
          <p className="text-[11px] text-muted">Press “Run swarm” on a round or “Run” on an agent to watch the pipeline execute step by step.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {runs.map((run) => (
            <RunCard key={run.runId} run={run} agentName={names.get(run.agentId)} />
          ))}
        </div>
      )}
    </div>
  );
}
