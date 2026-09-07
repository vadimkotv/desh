type SparklineProps = {
  values: number[];
  width?: number;
  height?: number;
  color?: string;
  min?: number; // fixed domain, e.g. 0
  max?: number; // fixed domain, e.g. 100
  ariaLabel?: string;
  className?: string;
};

type Point = { x: number; y: number };

export function sparkPoints(values: number[], w: number, h: number, pad: number, min?: number, max?: number): Point[] {
  const lo = min ?? Math.min(...values);
  const hi = max ?? Math.max(...values);
  const span = hi - lo || 1;
  const stepX = values.length > 1 ? (w - pad * 2) / (values.length - 1) : 0;
  return values.map((v, i) => ({
    x: values.length > 1 ? pad + i * stepX : w / 2,
    y: pad + (h - pad * 2) * (1 - (v - lo) / span),
  }));
}

// 2px line, ~10% area wash, ≥8px end marker with a 2px surface ring. One series,
// so no legend; the title of the tile names it. Draws itself in on mount.
export function Sparkline(props: SparklineProps) {
  const { values, width = 96, height = 28, color = 'var(--color-chart-accent)', min, max, ariaLabel, className = '' } = props;
  if (values.length === 0) return <svg width={width} height={height} className={className} aria-hidden />;
  const pad = 5;
  const pts = sparkPoints(values, width, height, pad, min, max);
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const last = pts[pts.length - 1] as Point;
  const area = `${line} L${last.x.toFixed(1)} ${height - pad} L${(pts[0] as Point).x.toFixed(1)} ${height - pad} Z`;
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={ariaLabel ?? `${values.length} points, latest ${values[values.length - 1]}`}
      className={`shrink-0 overflow-visible ${className}`}
    >
      {pts.length > 1 && <path d={area} fill={color} fillOpacity={0.1} />}
      {pts.length > 1 && (
        <path d={line} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" className="draw-line" />
      )}
      <circle cx={last.x} cy={last.y} r={5} fill="var(--color-panel)" />
      <circle cx={last.x} cy={last.y} r={3.5} fill={color} />
    </svg>
  );
}
