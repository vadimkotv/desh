export type Bar = { label: string; value: number; tone?: 'accent' | 'agent' | 'warn' | 'danger' | 'muted' };

type BarStripProps = { bars: Bar[]; height?: number; maxBarWidth?: number; className?: string; unit?: string };

const fills = {
  accent: 'var(--color-chart-accent)',
  agent: 'var(--color-chart-agent)',
  warn: 'var(--color-chart-warn)',
  danger: 'var(--color-chart-danger)',
  muted: 'var(--color-line-strong)',
};

// Columns from a single baseline: ≤24px thick, 4px rounded cap, square at the
// baseline, a 2px surface gap between neighbours. Only the max is direct-labeled;
// every column carries a <title> for hover and the table twin lives in the page.
export function BarStrip({ bars, height = 64, maxBarWidth = 18, className = '', unit = '' }: BarStripProps) {
  if (bars.length === 0) return null;
  const max = Math.max(...bars.map((b) => b.value), 0) || 1;
  const gap = 2;
  const slot = Math.min(maxBarWidth + gap, 28);
  const width = bars.length * slot;
  const top = 12;
  const plotH = height - top - 1;
  const maxIndex = bars.findIndex((b) => b.value === max);
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${bars.length} values`} className={`overflow-visible ${className}`}>
      <line x1={0} x2={width} y1={height - 0.5} y2={height - 0.5} stroke="var(--color-line-strong)" strokeWidth={1} />
      {bars.map((bar, i) => {
        const h = Math.max(bar.value > 0 ? 3 : 0, (bar.value / max) * plotH);
        const x = i * slot + gap / 2;
        const y = height - 1 - h;
        const w = slot - gap;
        const r = Math.min(4, w / 2, h);
        const d = `M${x} ${height - 1} V${y + r} a${r} ${r} 0 0 1 ${r} -${r} h${w - 2 * r} a${r} ${r} 0 0 1 ${r} ${r} V${height - 1} Z`;
        return (
          <g key={`${bar.label}-${i}`}>
            <path d={d} fill={fills[bar.tone ?? 'accent']} className="rise-in" style={{ animationDelay: `${i * 40}ms` }}>
              <title>{`${bar.label}: ${bar.value}${unit}`}</title>
            </path>
            {i === maxIndex && (
              <text x={x + w / 2} y={y - 4} textAnchor="middle" fill="var(--color-fg)" fontFamily="var(--font-mono)" fontSize={9}>
                {bar.value}
                {unit}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
