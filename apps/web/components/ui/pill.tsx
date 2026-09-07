import type { PillTone } from '@/lib/health';

const dot: Record<PillTone, string> = {
  live: 'bg-accent live-dot',
  degraded: 'bg-amber',
  off: 'bg-danger',
};

const text: Record<PillTone, string> = {
  live: 'text-accent',
  degraded: 'text-amber',
  off: 'text-danger',
};

type StatusPillProps = { label: string; state: string; tone: PillTone };

// Network / feature status pill: "Arc · live", "Claude · rules fallback".
export function StatusPill({ label, state, tone }: StatusPillProps) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-panel/80 px-2.5 py-1 font-mono text-[10.5px] tracking-wide">
      <span className={`inline-block h-1.5 w-1.5 rounded-full ${dot[tone]}`} aria-hidden />
      <span className="text-fg">{label}</span>
      <span className="text-dim">·</span>
      <span className={text[tone]}>{state}</span>
    </span>
  );
}

// Tiny live indicator used next to headers ("● live").
export function LiveDot({ on = true, label }: { on?: boolean; label?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-muted">
      <span className={`inline-block h-1.5 w-1.5 rounded-full ${on ? 'bg-accent live-dot' : 'bg-dim'}`} aria-hidden />
      {label ?? (on ? 'live' : 'idle')}
    </span>
  );
}
