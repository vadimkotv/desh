import { z } from 'zod';

// Numbers only a founder can supply: MRR, revenue, active users, runway. They are
// always a TIME SERIES — "MRR 2000" and "MRR 2000, up from 500 three months ago" are
// different companies, and only the second one is investable.
export const MetricPointSchema = z.object({
  at: z.string(), // ISO date of the observation
  value: z.number(),
});
export type MetricPoint = z.infer<typeof MetricPointSchema>;

// PUBLIC is in the open data room; GATED is released to an agent the founder approves.
export const Visibility = z.enum(['PUBLIC', 'GATED']);
export type Visibility = z.infer<typeof Visibility>;

export const MetricUnit = z.enum(['usd', 'count', 'bps', 'days', 'ratio']);
export type MetricUnit = z.infer<typeof MetricUnit>;

export const UpsertMetricSchema = z.object({
  key: z.string().min(2).max(60), // e.g. "revenue.mrr.usd"
  label: z.string().min(2).max(60),
  unit: MetricUnit.default('usd'),
  visibility: Visibility.default('PUBLIC'),
  points: z.array(MetricPointSchema).min(1).max(60),
});
export type UpsertMetric = z.infer<typeof UpsertMetricSchema>;

export const FounderMetricSchema = UpsertMetricSchema.extend({
  id: z.string(),
  startupId: z.string(),
  updatedAt: z.string(),
});
export type FounderMetric = z.infer<typeof FounderMetricSchema>;

// What a viewer gets back. A gated metric they have no grant for arrives `withheld`
// with an empty series: the agent still learns the metric EXISTS, which is what makes
// asking the founder for access a meaningful move rather than a shot in the dark.
export const DisclosedMetricSchema = FounderMetricSchema.extend({
  withheld: z.boolean(),
});
export type DisclosedMetric = z.infer<typeof DisclosedMetricSchema>;
