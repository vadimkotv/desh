import { PIPELINE_STEPS } from '@agentipo/shared';
import type { StepKey, StepState } from '@/lib/run-state';

type StepperProps = { steps: Record<StepKey, StepState>; compact?: boolean; short?: boolean };

const shortLabel: Record<StepKey, string> = { data: 'gather', gate: 'gate', policy: 'policy', engine: 'decide', settle: 'settle' };

const node: Record<StepState, string> = {
  pending: 'border-line-strong bg-raised text-dim',
  active: 'border-agent bg-agent/20 text-agent step-active',
  done: 'border-accent bg-accent text-ink',
  failed: 'border-danger bg-danger text-ink',
};

const label: Record<StepState, string> = {
  pending: 'text-dim',
  active: 'text-agent',
  done: 'text-fg',
  failed: 'text-danger',
};

const glyph: Record<StepState, string> = { pending: '', active: '', done: '✓', failed: '✕' };

// Horizontal pipeline stepper. Connectors fill in as steps complete; the active
// node pulses; failed steps go red. Pure CSS motion, works as a server component.
export function Stepper({ steps, compact = false, short = false }: StepperProps) {
  return (
    <ol className="flex w-full items-start" aria-label="pipeline">
      {PIPELINE_STEPS.map((step, i) => {
        const state = steps[step.key];
        const prev = i > 0 ? steps[PIPELINE_STEPS[i - 1]!.key] : 'done';
        const lineOn = prev === 'done' || prev === 'failed';
        return (
          <li key={step.key} className="flex min-w-0 flex-1 flex-col items-center">
            <div className="flex w-full items-center">
              <span
                className={`h-px flex-1 transition-colors duration-500 ${i === 0 ? 'opacity-0' : lineOn ? 'bg-accent/70' : 'bg-line-strong'}`}
                aria-hidden
              />
              <span
                className={`flex shrink-0 items-center justify-center rounded-full border font-mono font-bold transition-all duration-300 ${compact ? 'h-4 w-4 text-[9px]' : 'h-5 w-5 text-[10px]'} ${node[state]}`}
                aria-label={`${step.label}: ${state}`}
              >
                {state === 'active' ? <span className="live-dot h-1.5 w-1.5 rounded-full bg-agent" /> : glyph[state]}
              </span>
              <span
                className={`h-px flex-1 transition-colors duration-500 ${i === PIPELINE_STEPS.length - 1 ? 'opacity-0' : state === 'done' ? 'bg-accent/70' : 'bg-line-strong'}`}
                aria-hidden
              />
            </div>
            {!compact && (
              <span title={step.label} className={`mt-1.5 max-w-full truncate px-1 text-center font-mono text-[9.5px] leading-tight tracking-wide ${label[state]}`}>
                {short ? shortLabel[step.key] : step.label}
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
