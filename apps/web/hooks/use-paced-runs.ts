'use client';

import { useEffect, useState } from 'react';
import { isAgentLifecycle, type RunEvent } from '@agentipo/shared';
import { applyEvent, type RunView } from '@/lib/run-state';
import { subscribeRunEvents, type SseStatus } from '@/lib/sse';

// A whole run finishes in ~200ms on the rules engine — far too fast to watch.
// Events are queued per run and released one at a time so each stepper visibly
// walks, while concurrent runs (a swarm) still advance in parallel.
const PACE_MS = 300;

function upsert(runs: RunView[], event: RunEvent, limit: number): RunView[] {
  const index = runs.findIndex((r) => r.runId === event.runId);
  if (index === -1) return [applyEvent(undefined, event), ...runs].slice(0, limit);
  const next = runs.slice();
  next[index] = applyEvent(runs[index], event);
  return next;
}

type Lane = { queue: RunEvent[]; timer: number | null };

// Recent runs from GET /runs become the initial state without pacing; live
// events then merge into them (applyEvent dedupes by event id, upsert by runId).
const seedRuns = (seed: RunEvent[][], limit: number): RunView[] =>
  seed
    .filter((events) => events.length > 0)
    .map((events) => events.reduce<RunView | undefined>((view, e) => applyEvent(view, e), undefined) as RunView)
    .slice(0, limit);

// Subscribes to an SSE url (firehose or one run) and folds events into RunViews,
// newest run first. `url === null` disables the subscription.
export function usePacedRuns(url: string | null, limit = 8, seed: RunEvent[][] = []) {
  const [runs, setRuns] = useState<RunView[]>(() => seedRuns(seed, limit));
  const [status, setStatus] = useState<SseStatus>('closed');

  useEffect(() => {
    if (!url) return;
    const lanes = new Map<string, Lane>();
    let disposed = false;

    const drain = (lane: Lane) => {
      const next = lane.queue.shift();
      if (!next || disposed) {
        lane.timer = null;
        return;
      }
      setRuns((prev) => upsert(prev, next, limit));
      lane.timer = window.setTimeout(() => drain(lane), PACE_MS);
    };

    const unsubscribe = subscribeRunEvents(url, {
      onEvent: (event) => {
        if (isAgentLifecycle(event.type)) return; // firehose notice, not a run
        let lane = lanes.get(event.runId);
        if (!lane) {
          lane = { queue: [], timer: null };
          lanes.set(event.runId, lane);
        }
        lane.queue.push(event);
        if (lane.timer === null) drain(lane);
      },
      onStatus: setStatus,
      closeOnCompleted: url.includes('/runs/'), // the firehose outlives any single run
    });

    return () => {
      disposed = true;
      unsubscribe();
      for (const lane of lanes.values()) if (lane.timer !== null) window.clearTimeout(lane.timer);
    };
  }, [url, limit]);

  return { runs, status };
}
