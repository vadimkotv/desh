'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import type { Agent } from '@agentipo/shared';
import { RunSwarmButton } from '@/components/command/run-swarm-button';
import { RunLive } from '@/components/live/run-live';
import { Panel } from '@/components/ui/panel';
import type { SwarmRun } from '@/lib/api-types';
import type { RunView } from '@/lib/run-state';
import { SwarmTable } from './swarm-table';

type SwarmPanelProps = { roundId: string; agents: Agent[] };

// Launches every agent on this round, streams one stepper per agent, and folds
// their verdicts into the comparison table as they land.
export function SwarmPanel({ roundId, agents }: SwarmPanelProps) {
  const router = useRouter();
  const [runs, setRuns] = useState<SwarmRun[]>([]);
  const [views, setViews] = useState<Map<string, RunView>>(new Map());
  const onView = useCallback((view: RunView) => setViews((prev) => new Map(prev).set(view.runId, view)), []);
  const list = runs.map((r) => views.get(r.runId)).filter((v): v is RunView => Boolean(v));
  const allDone = runs.length > 0 && list.length === runs.length && list.every((v) => v.status !== 'running');

  useEffect(() => {
    if (allDone) router.refresh();
  }, [allDone, router]);

  return (
    <Panel
      eyebrow="agents · same round, different mandates"
      title="Swarm"
      tone="agent"
      action={
        <RunSwarmButton
          roundId={roundId}
          size="sm"
          label={runs.length > 0 ? 'Run swarm again' : 'Run swarm'}
          onStarted={(started) => {
            setViews(new Map());
            setRuns(started);
          }}
        />
      }
    >
      {runs.length === 0 ? (
        <p className="text-[12px] text-muted">
          Launch all {agents.length} agents on this round. Each buys the report over x402, applies its own mandate and
          settles on Arc — watch the same score turn into different verdicts.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          <div>
            <p className="eyebrow mb-2">{allDone ? 'verdicts' : 'verdicts forming…'}</p>
            <SwarmTable views={list} agents={agents} />
          </div>
          <div className="grid gap-2 xl:grid-cols-2">
            {runs.map((run) => (
              <RunLive key={run.runId} runId={run.runId} agentName={run.agentName} onView={onView} dense />
            ))}
          </div>
        </div>
      )}
    </Panel>
  );
}
