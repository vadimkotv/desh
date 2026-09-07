'use client';

import { useEffect, useMemo } from 'react';
import { usePacedRuns } from '@/hooks/use-paced-runs';
import { sseUrl } from '@/lib/api';
import type { RunView } from '@/lib/run-state';
import { RunCard } from './run-card';

type RunLiveProps = { runId: string; agentName?: string; onView?: (run: RunView) => void; dense?: boolean };

// Subscribes to a single run's replayable stream and renders its card. Parents
// that need the aggregate (e.g. the swarm comparison table) receive every view.
export function RunLive({ runId, agentName, onView, dense = false }: RunLiveProps) {
  const url = useMemo(() => sseUrl.run(runId), [runId]);
  const { runs } = usePacedRuns(url, 1);
  const run = runs[0];

  useEffect(() => {
    if (run && onView) onView(run);
  }, [run, onView]);

  if (!run) {
    return (
      <div className="shimmer rounded-lg border border-agent/30 p-3 font-mono text-[11px] text-muted">
        <span className="live-dot mr-1 text-agent">●</span>
        {agentName ?? 'agent'} · connecting to run {runId.slice(0, 8)}…
      </div>
    );
  }
  return <RunCard run={run} agentName={agentName} dense={dense} />;
}
