import { PIPELINE_STEPS, type DecisionAction, type RunEvent } from '@agentipo/shared';

export type StepKey = (typeof PIPELINE_STEPS)[number]['key'];
export type StepState = 'pending' | 'active' | 'done' | 'failed';
export type RunStatus = 'running' | 'completed' | 'failed';

export type RunDecision = {
  action: DecisionAction;
  amountUsdc: number;
  confidence: number;
  reasoning: string;
  engine: string;
  keyRisks: string[];
  equityShareBps: number | null;
};

export type RunView = {
  runId: string;
  agentId: string;
  agentName: string | null;
  startup: string | null;
  roundId: string | null;
  events: RunEvent[];
  steps: Record<StepKey, StepState>;
  status: RunStatus;
  startedAt: string;
  updatedAt: string;
  decision: RunDecision | null;
};

const str = (v: unknown): string | null => (typeof v === 'string' ? v : null);
const numOr = (v: unknown, d: number): number => (typeof v === 'number' ? v : d);

// Derives the stepper state for the round this run is currently working on.
// A run without a roundId walks every open round; the card follows the latest one.
export function currentRoundEvents(events: RunEvent[]): RunEvent[] {
  const lastRound = [...events].reverse().find((e) => e.roundId)?.roundId ?? null;
  return events.filter((e) => e.roundId === lastRound || e.roundId === null);
}

export function deriveSteps(events: RunEvent[]): Record<StepKey, StepState> {
  const types = new Set(currentRoundEvents(events).map((e) => e.type));
  const entries = PIPELINE_STEPS.map((step) => {
    const failed = step.done.find((t) => t.endsWith('.failed') && types.has(t));
    if (failed) return [step.key, 'failed'] as const;
    if (step.done.some((t) => types.has(t))) return [step.key, 'done'] as const;
    if (types.has(step.start)) return [step.key, 'active'] as const;
    return [step.key, 'pending'] as const;
  });
  return Object.fromEntries(entries) as Record<StepKey, StepState>;
}

function decisionOf(events: RunEvent[]): RunDecision | null {
  const scoped = [...currentRoundEvents(events)].reverse();
  // The engine is skipped when the policy leaves no budget; round.done still carries the verdict.
  const decided = scoped.find((e) => e.type === 'engine.decided') ?? scoped.find((e) => e.type === 'round.done');
  if (!decided) return null;
  const p = decided.payload;
  const action = str(p.action);
  if (action !== 'INVEST' && action !== 'PASS' && action !== 'WATCH') return null;
  const policy = scoped.find((e) => e.type === 'policy.evaluated')?.payload;
  const round = scoped.find((e) => e.type === 'round.discovered')?.payload;
  const amountUsdc = numOr(p.amountUsdc, 0);
  const target = numOr(round?.targetUsdc, 0);
  const equity = numOr(round?.equityBps, 0);
  return {
    action,
    amountUsdc,
    confidence: numOr(p.confidence, 0),
    reasoning: str(p.reasoning) ?? (policy ? `spending policy: ${str(policy.reason) ?? 'no budget'}` : ''),
    engine: str(p.engine) ?? 'policy',
    equityShareBps: target > 0 && equity > 0 ? (amountUsdc / target) * equity : null,
    keyRisks: Array.isArray(p.keyRisks) ? p.keyRisks.filter((r): r is string => typeof r === 'string') : [],
  };
}

function statusOf(events: RunEvent[]): RunStatus {
  if (!events.some((e) => e.type === 'run.completed')) return 'running';
  const failed = events.some((e) => e.type === 'round.failed' || e.type === 'settlement.failed');
  return failed ? 'failed' : 'completed';
}

// Pure fold: (existing view | undefined, event) -> next view. Idempotent on ids.
export function applyEvent(view: RunView | undefined, event: RunEvent): RunView {
  const prior = view?.events ?? [];
  if (prior.some((e) => e.id === event.id)) return view as RunView;
  const events = [...prior, event].sort((a, b) => a.id - b.id);
  const started = events.find((e) => e.type === 'run.started');
  const discovered = [...events].reverse().find((e) => e.type === 'round.discovered');
  return {
    runId: event.runId,
    agentId: event.agentId,
    agentName: str(started?.payload.agent) ?? view?.agentName ?? null,
    startup: str(discovered?.payload.startup) ?? view?.startup ?? null,
    roundId: discovered?.roundId ?? str(started?.payload.roundId) ?? view?.roundId ?? null,
    events,
    steps: deriveSteps(events),
    status: statusOf(events),
    startedAt: view?.startedAt ?? event.at,
    updatedAt: event.at,
    decision: decisionOf(events),
  };
}
