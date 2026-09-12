import { Injectable } from '@nestjs/common';
import type { RunEvent, RunEventType } from '@agentipo/shared';
import { type Observable, ReplaySubject, Subject } from 'rxjs';
import type { RunReporter } from '../domain/run-reporter';

const RUN_TTL_MS = 10 * 60 * 1000;
const HISTORY_RUNS = 50;

// In-process event bus for agent runs. Each run has a replayable stream (so a client
// that subscribes after the run started still sees every step), a global firehose, and
// a bounded history so the command center can show recent runs after a page load.
@Injectable()
export class RunEventBus {
  private readonly runs = new Map<string, ReplaySubject<RunEvent>>();
  private readonly history = new Map<string, RunEvent[]>();
  private readonly firehose = new Subject<RunEvent>();
  private seq = 0;

  reporter(runId: string, agentId: string, roundId: string | null = null): RunReporter {
    const emit = (type: RunEventType, payload: Record<string, unknown> = {}) =>
      this.publish({ id: ++this.seq, runId, agentId, roundId, type, at: new Date().toISOString(), payload });
    return { runId, emit, forRound: (id) => this.reporter(runId, agentId, id) };
  }

  // Lifecycle notices belong on the firehose but are not part of any run, so they skip
  // the per-run replay stream and the bounded history.
  announce(agentId: string, type: RunEventType, payload: Record<string, unknown> = {}): void {
    this.firehose.next({ id: ++this.seq, runId: `agent:${agentId}`, agentId, roundId: null, type, at: new Date().toISOString(), payload });
  }

  run$(runId: string): Observable<RunEvent> {
    return this.subjectFor(runId).asObservable();
  }

  get all$(): Observable<RunEvent> {
    return this.firehose.asObservable();
  }

  recent(limit = 10): RunEvent[][] {
    return [...this.history.values()].slice(-limit).reverse();
  }

  private publish(event: RunEvent): void {
    this.subjectFor(event.runId).next(event);
    this.firehose.next(event);
    this.remember(event);
    if (event.type === 'run.completed') {
      this.subjectFor(event.runId).complete();
      setTimeout(() => this.runs.delete(event.runId), RUN_TTL_MS).unref();
    }
  }

  private remember(event: RunEvent): void {
    const events = this.history.get(event.runId) ?? [];
    events.push(event);
    this.history.delete(event.runId);
    this.history.set(event.runId, events);
    if (this.history.size > HISTORY_RUNS) this.history.delete(this.history.keys().next().value as string);
  }

  private subjectFor(runId: string): ReplaySubject<RunEvent> {
    let subject = this.runs.get(runId);
    if (!subject) {
      subject = new ReplaySubject<RunEvent>();
      this.runs.set(runId, subject);
    }
    return subject;
  }
}
