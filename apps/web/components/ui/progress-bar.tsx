type ProgressBarProps = {
  value: number; // 0..100
  tone?: 'accent' | 'amber' | 'info';
  className?: string;
};

const fills = {
  accent: 'bg-accent',
  amber: 'bg-amber',
  info: 'bg-info',
};

export function ProgressBar({ value, tone = 'accent', className = '' }: ProgressBarProps) {
  const width = Math.min(100, Math.max(0, value));
  return (
    <div className={`h-1.5 w-full overflow-hidden rounded-full bg-raised ${className}`}>
      <div className={`h-full rounded-full ${fills[tone]}`} style={{ width: `${width}%` }} />
    </div>
  );
}
