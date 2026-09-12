import type { MetricPoint, UpsertMetric } from '@agentipo/shared';

// Monthly readings ending last month, oldest first.
const monthly = (values: number[]): MetricPoint[] => {
  const now = new Date();
  return values.map((value, i) => {
    const at = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (values.length - i), 1));
    return { at: at.toISOString(), value };
  });
};

// Three deliberately different trajectories, so the same headline number reads as a
// different investment depending on its slope — the whole point of tracking growth.
export const DEMO_METRICS: Record<string, UpsertMetric[]> = {
  // Compounding: every number is small but the slope is the story.
  'Meridian Yield': [
    { key: 'revenue.mrr.usd', label: 'MRR', unit: 'usd', visibility: 'PUBLIC', points: monthly([500, 900, 1_600, 2_400, 3_500, 4_800]) },
    { key: 'users.active.count', label: 'Active wallets', unit: 'count', visibility: 'PUBLIC', points: monthly([120, 260, 430, 700, 1_050, 1_450]) },
    { key: 'revenue.net.usd', label: 'Net revenue', unit: 'usd', visibility: 'GATED', points: monthly([210, 380, 700, 1_150, 1_700, 2_400]) },
    { key: 'runway.months', label: 'Runway', unit: 'days', visibility: 'GATED', points: monthly([9, 11, 14, 17, 19, 22]) },
  ],
  // Flat: the headline MRR looks similar, the trajectory does not.
  'Orbital Agents': [
    { key: 'users.active.count', label: 'Registered agents', unit: 'count', visibility: 'PUBLIC', points: monthly([840, 870, 910, 880, 905, 920]) },
    { key: 'revenue.mrr.usd', label: 'MRR', unit: 'usd', visibility: 'GATED', points: monthly([3_900, 4_100, 4_000, 4_250, 4_100, 4_300]) },
  ],
  // One reading: a number with no slope proves nothing, and the UI must say so.
  'Ledgerline Payroll': [
    { key: 'revenue.mrr.usd', label: 'MRR', unit: 'usd', visibility: 'PUBLIC', points: monthly([2_000]).slice(-1) },
    { key: 'payroll.volume.usd', label: 'Payroll processed', unit: 'usd', visibility: 'GATED', points: monthly([18_000, 26_000, 31_000]) },
  ],
};
