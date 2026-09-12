import { formatPerMonth, trendOf, type DisclosedMetric } from '@agentipo/shared';
import { Sparkline } from '@/components/charts/sparkline';
import { Badge } from '@/components/ui/badge';

const fmt = (value: number, unit: string): string =>
  unit === 'usd'
    ? `$${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
    : value.toLocaleString('en-US', { maximumFractionDigits: unit === 'ratio' ? 2 : 0 });

const signed = (ratio: number): string => `${ratio >= 0 ? '+' : ''}${Math.round(ratio * 100)}%`;

// A metric is only meaningful as a trajectory, so the slope gets equal billing with
// the number: "$4,800" alone is not an investment case, "$4,800, +$717/mo" is.
export function MetricCard({ metric }: { metric: DisclosedMetric }) {
  const trend = metric.withheld ? null : trendOf(metric.points);
  const rate = trend ? formatPerMonth(trend, metric.unit) : null;
  const up = (trend?.growthPct ?? 0) > 0;

  return (
    <article className="flex flex-col gap-1.5 rounded-lg border border-line bg-panel/90 p-3">
      <div className="flex items-start justify-between gap-2">
        <p className="eyebrow truncate" title={metric.key}>{metric.label}</p>
        {metric.visibility === 'GATED' && (
          <Badge tone={metric.withheld ? 'neutral' : 'accent'} title={metric.withheld ? 'the founder has not opened this' : 'opened to you by the founder'}>
            {metric.withheld ? '🔒 gated' : '🔓 opened'}
          </Badge>
        )}
      </div>

      {metric.withheld || !trend ? (
        <>
          <p className="num text-[18px] font-semibold text-dim">— — —</p>
          <p className="font-mono text-[10px] text-dim">
            {metric.withheld ? 'withheld · unknown, not zero' : 'no readings'}
          </p>
        </>
      ) : (
        <>
          <div className="flex items-end justify-between gap-2">
            <p className="num text-[18px] font-semibold text-bright">{fmt(trend.latest, metric.unit)}</p>
            {trend.points.length > 1 && (
              <Sparkline values={trend.points.map((p) => p.value)} min={0} width={72} height={26} color={up ? 'var(--color-chart-accent)' : 'var(--color-chart-warn)'} />
            )}
          </div>
          {trend.points.length > 1 ? (
            <p className="font-mono text-[10.5px]">
              <span className={up ? 'text-accent' : 'text-amber'}>{rate ?? '—'}</span>
              {trend.growthPct !== null && (
                <span className="text-muted"> · {signed(trend.growthPct)} over {trend.months.toFixed(1)}mo</span>
              )}
            </p>
          ) : (
            <p className="font-mono text-[10.5px] text-amber">single reading · no trajectory yet</p>
          )}
        </>
      )}
    </article>
  );
}
