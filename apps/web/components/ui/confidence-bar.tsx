import { Meter } from '@/components/charts/meter';

type ConfidenceBarProps = { confidence: number; width?: string };

// 0..1 confidence as a severity meter with the percentage in text tokens.
export function ConfidenceBar({ confidence, width = 'w-20' }: ConfidenceBarProps) {
  const pct = Math.round(Math.min(1, Math.max(0, confidence)) * 100);
  return (
    <div className="flex items-center gap-2" title={`confidence ${pct}%`}>
      <Meter value={pct} tone="auto" className={width} />
      <span className="num text-[10.5px] text-muted">{pct}% conf</span>
    </div>
  );
}
