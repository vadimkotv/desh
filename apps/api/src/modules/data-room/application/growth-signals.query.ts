import { Inject, Injectable } from '@nestjs/common';
import { GROWTH_METRIC_KEYS, SignalKeys, trendOf, type Signal } from '@agentipo/shared';
import { signal } from '../domain/data-provider.port';
import { FOUNDER_METRIC_REPOSITORY, type FounderMetricRepository } from '../domain/founder-metric.repository';

const DAYS_PER_MONTH = 30;

// Turns the founder's PUBLIC metrics into signals the due-diligence evaluators can
// score. Only public ones: the shared report must read the same for every agent, so a
// gated number influences an individual agent's reasoning, never the public score.
@Injectable()
export class GrowthSignalsQuery {
  constructor(@Inject(FOUNDER_METRIC_REPOSITORY) private readonly metrics: FounderMetricRepository) {}

  async execute(startupId: string): Promise<Signal[]> {
    const metrics = (await this.metrics.listByStartup(startupId)).filter((m) => m.visibility === 'PUBLIC');
    const signals: Signal[] = [];
    let spanDays = 0;

    for (const metric of metrics) {
      const keys = GROWTH_METRIC_KEYS[metric.key as keyof typeof GROWTH_METRIC_KEYS];
      const trend = trendOf(metric.points);
      if (!keys || !trend) continue;

      const meta = { label: metric.label, readings: trend.points.length };
      spanDays = Math.max(spanDays, trend.months * DAYS_PER_MONTH);
      signals.push(signal('founder-metrics', keys.latest, trend.latest, metric.unit, meta));
      // A single reading has no slope. Emitting nothing keeps it out of the score and
      // lands the category in "unknown" rather than quietly scoring it as flat.
      if (trend.perMonth === null || trend.growthPct === null) continue;
      signals.push(signal('founder-metrics', keys.perMonth, trend.perMonth, metric.unit, meta));
      signals.push(signal('founder-metrics', keys.growth, Math.round(trend.growthPct * 10_000), 'bps', meta));
    }

    if (signals.length > 0) {
      signals.push(signal('founder-metrics', SignalKeys.metricsSpanDays, Math.round(spanDays), 'days'));
    }
    return signals;
  }
}
