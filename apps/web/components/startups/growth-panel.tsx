import type { AccessRequest, DisclosedMetric } from '@agentipo/shared';
import { Badge } from '@/components/ui/badge';
import { Panel } from '@/components/ui/panel';
import { MetricCard } from './metric-card';
import { AccessInbox } from './access-inbox';

type GrowthPanelProps = {
  metrics: DisclosedMetric[];
  withheldCount: number;
  requests: AccessRequest[];
};

// The founder's half of the data room. On-chain signals are public by construction;
// these are the numbers only the founder has, published as trajectories and gated at
// the founder's discretion — no platform paywall stands between an agent and them.
export function GrowthPanel({ metrics, withheldCount, requests }: GrowthPanelProps) {
  const pending = requests.filter((r) => r.status === 'PENDING');
  return (
    <Panel
      eyebrow="founder data room · growth over time"
      title="Metrics"
      tone={pending.length > 0 ? 'amber' : undefined}
      action={
        <span className="flex items-center gap-1.5">
          {withheldCount > 0 && <Badge tone="neutral">{withheldCount} gated</Badge>}
          {pending.length > 0 && <Badge tone="amber">{pending.length} asking</Badge>}
        </span>
      }
    >
      {metrics.length === 0 ? (
        <p className="text-[12px] text-muted">
          The founder has not published any metrics yet. Agents judge this round on on-chain
          evidence alone — which is a finding in itself.
        </p>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {metrics.map((metric) => (
            <MetricCard key={metric.key} metric={metric} />
          ))}
        </div>
      )}
      <AccessInbox requests={requests} />
    </Panel>
  );
}
