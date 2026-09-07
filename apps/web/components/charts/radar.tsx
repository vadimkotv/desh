export type RadarAxis = { label: string; value: number; weight?: number; tone?: string };

type RadarProps = { axes: RadarAxis[]; size?: number; color?: string; className?: string };

const polar = (cx: number, cy: number, r: number, i: number, n: number) => {
  const angle = -Math.PI / 2 + (i / n) * Math.PI * 2;
  return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
};

const fmt = (p: { x: number; y: number }) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`;

// Radar over finding categories (0–100 each). Rings are solid hairlines at 25/50/75/100,
// the series is a 2px outline with a 10% wash, vertices are ≥8px markers ringed
// in the surface color. Labels sit outside the outer ring in text tokens; the
// weight is shown next to each label so the reader can see which axes count more.
export function Radar({ axes, size = 240, color = 'var(--color-chart-accent)', className = '' }: RadarProps) {
  const n = axes.length;
  if (n < 3) return null;
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 54;
  const rings = [25, 50, 75, 100];
  const outline = axes.map((a, i) => fmt(polar(cx, cy, (radius * Math.min(100, Math.max(0, a.value))) / 100, i, n))).join(' ');
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="scores per finding category" className={`overflow-visible ${className}`}>
      {rings.map((r) => (
        <polygon
          key={r}
          points={axes.map((_, i) => fmt(polar(cx, cy, (radius * r) / 100, i, n))).join(' ')}
          fill="none"
          stroke="var(--color-line)"
          strokeWidth={1}
        />
      ))}
      {axes.map((_, i) => {
        const p = polar(cx, cy, radius, i, n);
        return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="var(--color-line)" strokeWidth={1} />;
      })}
      <polygon points={outline} fill={color} fillOpacity={0.12} stroke={color} strokeWidth={2} strokeLinejoin="round" className="fade-in" />
      {axes.map((a, i) => {
        const p = polar(cx, cy, (radius * Math.min(100, Math.max(0, a.value))) / 100, i, n);
        const l = polar(cx, cy, radius + 18, i, n);
        const anchor = Math.abs(l.x - cx) < 6 ? 'middle' : l.x > cx ? 'start' : 'end';
        return (
          <g key={a.label}>
            <circle cx={p.x} cy={p.y} r={5.5} fill="var(--color-panel)" />
            <circle cx={p.x} cy={p.y} r={3.5} fill={a.tone ?? color}>
              <title>{`${a.label}: ${Math.round(a.value)}/100${a.weight !== undefined ? ` · weight ${Math.round(a.weight * 100)}%` : ''}`}</title>
            </circle>
            <text x={l.x} y={l.y - 2} textAnchor={anchor} fill="var(--color-fg)" fontFamily="var(--font-mono)" fontSize={10}>
              {a.label}
            </text>
            <text x={l.x} y={l.y + 9} textAnchor={anchor} fill="var(--color-muted)" fontFamily="var(--font-mono)" fontSize={9}>
              {Math.round(a.value)}
              {a.weight !== undefined ? ` · w${Math.round(a.weight * 100)}` : ''}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
