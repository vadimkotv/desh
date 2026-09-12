import type { MetricPoint } from './metrics.js';

const MS_PER_MONTH = 30 * 24 * 60 * 60 * 1000;

// A metric read as a trajectory rather than a number.
export interface Trend {
  latest: number;
  first: number;
  previous: number | null; // the reading before the latest one
  deltaAbs: number | null; // latest − previous
  deltaPct: number | null; // (latest − previous) / |previous|
  perMonth: number | null; // average absolute change per month across the series
  growthPct: number | null; // (latest − first) / |first| across the whole series
  months: number; // span covered, in months
  points: MetricPoint[]; // chronological
}

const ms = (p: MetricPoint): number => Date.parse(p.at);
const pct = (from: number, to: number): number | null => (from === 0 ? null : (to - from) / Math.abs(from));

// Sorts by date and derives the trajectory. A single reading has no trend — every
// delta comes back null rather than 0, so the UI can say "one data point" honestly.
export function trendOf(points: MetricPoint[]): Trend | null {
  const sorted = [...points].filter((p) => Number.isFinite(ms(p))).sort((a, b) => ms(a) - ms(b));
  const last = sorted.at(-1);
  const head = sorted[0];
  if (!last || !head) return null;

  const previous = sorted.length > 1 ? (sorted.at(-2) as MetricPoint) : null;
  const months = (ms(last) - ms(head)) / MS_PER_MONTH;
  return {
    latest: last.value,
    first: head.value,
    previous: previous?.value ?? null,
    deltaAbs: previous ? last.value - previous.value : null,
    deltaPct: previous ? pct(previous.value, last.value) : null,
    perMonth: months > 0 ? (last.value - head.value) / months : null,
    growthPct: sorted.length > 1 ? pct(head.value, last.value) : null,
    months,
    points: sorted,
  };
}

// "+$1,500/mo" — the half of a metric that actually tells an investor something.
export function formatPerMonth(trend: Trend, unit: string): string | null {
  if (trend.perMonth === null || trend.perMonth === 0) return null;
  const sign = trend.perMonth > 0 ? '+' : '−';
  const magnitude = Math.abs(trend.perMonth);
  const body =
    unit === 'usd'
      ? `$${magnitude.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
      : magnitude.toLocaleString('en-US', { maximumFractionDigits: 2 });
  return `${sign}${body}/mo`;
}
