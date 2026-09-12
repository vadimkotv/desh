import { formatPerMonth, trendOf, type DisclosedMetric, type Trend } from '@agentipo/shared';

const fmt = (value: number, unit: string): string =>
  unit === 'usd'
    ? `$${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
    : value.toLocaleString('en-US', { maximumFractionDigits: 2 });

const signed = (ratio: number): string => `${ratio >= 0 ? '+' : ''}${(ratio * 100).toFixed(0)}%`;

// One metric as a trajectory. "MRR: $2,000" and "MRR: $2,000 (+$1,500/mo, +300% over
// 3.0 months, latest step +150%)" describe very different companies; only the second
// is something an investor can act on, so the prompt never shows a bare number.
function line(metric: DisclosedMetric, trend: Trend): string {
  const parts = [`${fmt(trend.latest, metric.unit)}`];
  const rate = formatPerMonth(trend, metric.unit);
  if (rate) parts.push(rate);
  if (trend.growthPct !== null) parts.push(`${signed(trend.growthPct)} over ${trend.months.toFixed(1)} months`);
  if (trend.deltaPct !== null) parts.push(`latest step ${signed(trend.deltaPct)}`);
  const series = trend.points.map((p) => `${p.at.slice(0, 7)}:${fmt(p.value, metric.unit)}`).join(' → ');
  return `- ${metric.label} (${metric.key}): ${parts.join(', ')}\n    series: ${series}`;
}

// The founder-published half of the data room, rendered for the decision engine.
// Withheld metrics are listed by name on purpose: "they have revenue numbers and will
// not show them" is itself a signal, and a missing series is not a zero.
export function growthSection(metrics: DisclosedMetric[]): string {
  if (metrics.length === 0) {
    return '## Founder metrics\nThe founder has published no metrics. Judge on on-chain evidence alone.';
  }
  const open: string[] = [];
  const withheld: string[] = [];
  for (const metric of metrics) {
    if (metric.withheld) {
      withheld.push(`${metric.label} (${metric.key})`);
      continue;
    }
    const trend = trendOf(metric.points);
    if (!trend) continue;
    open.push(trend.points.length > 1 ? line(metric, trend) : `- ${metric.label}: ${fmt(trend.latest, metric.unit)} (single reading — no trajectory, treat as unproven)`);
  }

  const body = open.length ? open.join('\n') : 'None disclosed.';
  const tail = withheld.length
    ? `\n\nWithheld by the founder (access requested, not yet granted): ${withheld.join('; ')}.\nTreat these as unknown, never as zero, and let the refusal weigh on your confidence.`
    : '';
  return `## Founder metrics (growth over time)\n${body}${tail}`;
}
