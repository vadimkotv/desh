import type { AccountRole } from '@agentipo/shared';

const labelFor = (role: AccountRole | null): string =>
  role === 'FOUNDER' ? 'List startup' : role === 'INVESTOR' ? 'Create agent' : 'Set up';

export function StepRail({ step, role }: { step: number; role: AccountRole | null }) {
  const steps = ['Sign in', 'Pick a side', labelFor(role)];
  return (
    <ol className="flex items-center gap-2" aria-label="onboarding progress">
      {steps.map((label, i) => {
        const done = i < step;
        const current = i === step;
        return (
          <li key={label} className="flex flex-1 items-center gap-2">
            <span
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border font-mono text-[10px] font-bold ${
                done
                  ? 'border-accent bg-accent text-ink'
                  : current
                    ? 'border-accent bg-accent/20 text-accent'
                    : 'border-line-strong bg-raised text-dim'
              }`}
            >
              {done ? '✓' : i + 1}
            </span>
            <span className={`font-mono text-[10.5px] uppercase tracking-wider ${current ? 'text-accent' : done ? 'text-fg' : 'text-dim'}`}>
              {label}
            </span>
            {i < steps.length - 1 && <span className={`h-px flex-1 ${done ? 'bg-accent/70' : 'bg-line-strong'}`} aria-hidden />}
          </li>
        );
      })}
    </ol>
  );
}
