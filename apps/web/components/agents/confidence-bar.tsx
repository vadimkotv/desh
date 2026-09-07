import { ProgressBar } from '@/components/ui/progress-bar';

export function ConfidenceBar({ confidence }: { confidence: number }) {
  const pct = Math.round(confidence * 100);
  return (
    <div className="flex items-center gap-2">
      <ProgressBar value={pct} tone={pct >= 70 ? 'accent' : pct >= 40 ? 'amber' : 'info'} className="w-24" />
      <span className="font-mono text-[11px] tabular-nums text-muted">{pct}% conf</span>
    </div>
  );
}
