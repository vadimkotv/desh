import type { RoundStatus } from '@agentipo/shared';

const STAGES: { key: RoundStatus; label: string; hint: string }[] = [
  { key: 'OPEN', label: 'Open', hint: 'agents invest USDC' },
  { key: 'FUNDED', label: 'Funded', hint: 'target reached' },
  { key: 'CLOSED', label: 'Closed', hint: 'finalized · milestones release' },
  { key: 'REPAID', label: 'Repaid', hint: 'revenue hit the cap' },
];

const order: Record<RoundStatus, number> = { OPEN: 0, FUNDED: 1, CLOSED: 2, REPAID: 3, FAILED: 1 };

// Round lifecycle: Open → Funded → Closed → Repaid, with the Failed branch off Open.
export function LifecycleStrip({ status }: { status: RoundStatus }) {
  const reached = order[status];
  const failed = status === 'FAILED';
  return (
    <div className="rounded-lg border border-line bg-panel/90 px-4 py-3">
      <ol className="flex items-start" aria-label="round lifecycle">
        {STAGES.map((stage, i) => {
          const idx = i;
          const done = !failed && idx < reached;
          const current = !failed && idx === reached;
          const dead = failed && idx >= 1;
          const node = current
            ? 'border-accent bg-accent/20 text-accent step-active'
            : done
              ? 'border-accent bg-accent text-ink'
              : dead
                ? 'border-line bg-raised text-dim line-through'
                : 'border-line-strong bg-raised text-dim';
          return (
            <li key={stage.key} className="flex min-w-0 flex-1 flex-col items-center">
              <div className="flex w-full items-center">
                <span className={`h-px flex-1 ${i === 0 ? 'opacity-0' : done || current ? 'bg-accent/70' : 'bg-line-strong'}`} aria-hidden />
                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border font-mono text-[10px] font-bold ${node}`}>
                  {done ? '✓' : current ? <span className="live-dot h-1.5 w-1.5 rounded-full bg-accent" /> : i + 1}
                </span>
                <span className={`h-px flex-1 ${i === STAGES.length - 1 ? 'opacity-0' : done ? 'bg-accent/70' : 'bg-line-strong'}`} aria-hidden />
              </div>
              <span className={`mt-1.5 font-mono text-[10.5px] uppercase tracking-wider ${current ? 'text-accent' : done ? 'text-fg' : 'text-dim'}`}>{stage.label}</span>
              <span className="hidden font-mono text-[9.5px] text-dim sm:block">{stage.hint}</span>
            </li>
          );
        })}
      </ol>
      {failed && (
        <p className="mt-2 text-center font-mono text-[10.5px] text-danger">✕ FAILED · target missed by the deadline — investors are refunded from escrow</p>
      )}
    </div>
  );
}
