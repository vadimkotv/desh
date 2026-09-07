import { scoreColor } from '@/components/ui/badge';

type RingProps = {
  value: number; // 0..100
  size?: number;
  stroke?: number;
  label?: string; // text under the number, e.g. "score"
  color?: string; // overrides the severity color
  showValue?: boolean;
  className?: string;
};

// Ring gauge: a single ratio against a limit. The unfilled track is one step off
// the surface; the fill carries severity (accent → warn → danger) unless overridden.
export function Ring({ value, size = 72, stroke = 6, label, color, showValue = true, className = '' }: RingProps) {
  const clamped = Math.min(100, Math.max(0, value));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped / 100);
  const fill = color ?? scoreColor(clamped);
  const fontSize = size >= 64 ? size / 3.6 : size / 3;
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={`${label ?? 'value'} ${Math.round(clamped)} of 100`}
      className={`shrink-0 ${className}`}
    >
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--color-chart-track)" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={fill}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.2, 0.8, 0.2, 1)' }}
      />
      {showValue && (
        <text
          x="50%"
          y={label ? '46%' : '50%'}
          dominantBaseline="central"
          textAnchor="middle"
          fill="var(--color-bright)"
          fontFamily="var(--font-mono)"
          fontSize={fontSize}
          fontWeight={600}
        >
          {Math.round(clamped)}
        </text>
      )}
      {label && (
        <text
          x="50%"
          y="66%"
          dominantBaseline="central"
          textAnchor="middle"
          fill="var(--color-muted)"
          fontFamily="var(--font-mono)"
          fontSize={Math.max(8, size / 8)}
          letterSpacing="0.08em"
        >
          {label.toUpperCase()}
        </text>
      )}
    </svg>
  );
}
