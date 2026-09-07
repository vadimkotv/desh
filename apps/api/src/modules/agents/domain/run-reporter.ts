import type { RunEventType } from '@agentipo/shared';

// Handed to every pipeline step so it can narrate progress without knowing about
// transports (SSE, logs, ...). A no-op reporter keeps steps usable from scripts.
export interface RunReporter {
  readonly runId: string;
  emit(type: RunEventType, payload?: Record<string, unknown>): void;
  forRound(roundId: string): RunReporter;
}

export const NOOP_REPORTER: RunReporter = {
  runId: 'noop',
  emit: () => undefined,
  forRound: () => NOOP_REPORTER,
};
