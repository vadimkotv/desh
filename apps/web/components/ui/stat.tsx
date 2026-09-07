type StatProps = {
  label: string;
  value: string;
  hint?: string;
};

export function Stat({ label, value, hint }: StatProps) {
  return (
    <div className="rounded-lg border border-line bg-panel/90 px-4 py-3">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">{label}</p>
      <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-fg">{value}</p>
      {hint && <p className="mt-0.5 text-[11px] text-muted">{hint}</p>}
    </div>
  );
}
