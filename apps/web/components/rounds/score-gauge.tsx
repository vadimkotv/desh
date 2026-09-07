type ScoreGaugeProps = { score: number; size?: number };

const colorFor = (score: number): string =>
  score >= 70 ? 'var(--color-accent)' : score >= 40 ? 'var(--color-amber)' : 'var(--color-danger)';

// SVG ring gauge, 0–100. Pure server component: no client JS needed.
export function ScoreGauge({ score, size = 96 }: ScoreGaugeProps) {
  const stroke = 8;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(100, Math.max(0, score));
  const offset = circumference * (1 - clamped / 100);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`score ${Math.round(clamped)} of 100`}>
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--color-raised)" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={colorFor(clamped)}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" fill="var(--color-fg)" fontFamily="var(--font-mono)" fontSize={size / 4} fontWeight={600}>
        {Math.round(clamped)}
      </text>
    </svg>
  );
}
