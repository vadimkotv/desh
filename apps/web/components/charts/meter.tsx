import type { ReactNode } from 'react';

export type MeterTone = 'accent' | 'agent' | 'warn' | 'danger' | 'info' | 'auto';

type MeterProps = {
  value: number; // 0..100
  tone?: MeterTone;
  height?: number;
  className?: string;
  marker?: number; // optional threshold tick, 0..100
};

const fills: Record<Exclude<MeterTone, 'auto'>, string> = {
  accent: 'bg-chart-accent',
  agent: 'bg-chart-agent',
  warn: 'bg-chart-warn',
  danger: 'bg-chart-danger',
  info: 'bg-info',
};

const autoTone = (v: number): Exclude<MeterTone, 'auto'> => (v >= 70 ? 'accent' : v >= 40 ? 'warn' : 'danger');

// Meter: a single ratio against a limit. The unfilled track is one step off the
// surface; the fill carries severity or a fixed identity hue.
export function Meter({ value, tone = 'accent', height = 4, className = '', marker }: MeterProps) {
  const width = Math.min(100, Math.max(0, value));
  const fill = fills[tone === 'auto' ? autoTone(width) : tone];
  return (
    <div className={`relative w-full overflow-hidden rounded-full bg-chart-track ${className}`} style={{ height }}>
      <div className={`h-full rounded-full ${fill}`} style={{ width: `${width}%`, transition: 'width 0.6s cubic-bezier(0.2,0.8,0.2,1)' }} />
      {marker !== undefined && (
        <span className="absolute top-0 h-full w-[2px] bg-bright/70" style={{ left: `${Math.min(100, Math.max(0, marker))}%` }} aria-hidden />
      )}
    </div>
  );
}

type LabeledMeterProps = MeterProps & { label: string; valueText: ReactNode; hint?: string };

// Label row + meter: "min score ── 60 / 100". Values are text tokens, never the fill hue.
export function LabeledMeter({ label, valueText, hint, ...meter }: LabeledMeterProps) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between gap-3">
        <span className="eyebrow">{label}</span>
        <span className="num text-[11.5px] text-fg">
          {valueText}
          {hint && <span className="ml-1 text-muted">{hint}</span>}
        </span>
      </div>
      <Meter {...meter} />
    </div>
  );
}
