'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { sseUrl } from '@/lib/api';
import { subscribeRunEvents } from '@/lib/sse';

// Server-rendered pages are a snapshot; background agents keep working after it is
// taken. This re-renders the route whenever a run reaches a conclusion, so new
// startups and fresh verdicts appear without anyone touching reload.
const SETTLE_MS = 900;

const TRIGGERS = new Set([
  'round.done',
  'round.failed',
  'settlement.confirmed',
  'approval.requested',
  'agent.started',
  'agent.paused',
]);

export function LiveRefresh() {
  const router = useRouter();

  useEffect(() => {
    let timer: number | null = null;
    const unsubscribe = subscribeRunEvents(sseUrl.firehose(), {
      closeOnCompleted: false,
      onEvent: (event) => {
        if (!TRIGGERS.has(event.type)) return;
        if (timer !== null) window.clearTimeout(timer);
        timer = window.setTimeout(() => router.refresh(), SETTLE_MS);
      },
    });
    return () => {
      if (timer !== null) window.clearTimeout(timer);
      unsubscribe();
    };
  }, [router]);

  return null;
}
