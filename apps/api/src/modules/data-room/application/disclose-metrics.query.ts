import { Inject, Injectable } from '@nestjs/common';
import type { DisclosedMetric, FounderMetric } from '@agentipo/shared';
import {
  ACCESS_REQUEST_REPOSITORY,
  FOUNDER_METRIC_REPOSITORY,
  type AccessRequestRepository,
  type FounderMetricRepository,
} from '../domain/founder-metric.repository';

export interface Disclosure {
  metrics: DisclosedMetric[];
  gatedCount: number; // gated metrics that exist for this startup
  withheldCount: number; // gated metrics this viewer cannot see yet
  access: 'NONE' | 'PENDING' | 'GRANTED' | 'DENIED';
}

// What one viewer may see of a founder's numbers. A withheld metric keeps its name and
// unit but loses its series — the agent learns what exists without learning its value,
// which is exactly the information it needs to decide whether to ask for access.
@Injectable()
export class DiscloseMetricsQuery {
  constructor(
    @Inject(FOUNDER_METRIC_REPOSITORY) private readonly metrics: FounderMetricRepository,
    @Inject(ACCESS_REQUEST_REPOSITORY) private readonly requests: AccessRequestRepository,
  ) {}

  async execute(startupId: string, agentId?: string): Promise<Disclosure> {
    const [all, request] = await Promise.all([
      this.metrics.listByStartup(startupId),
      agentId ? this.requests.find(startupId, agentId) : Promise.resolve(null),
    ]);
    const granted = request?.status === 'GRANTED';
    const metrics = all.map((metric) => this.disclose(metric, granted));
    return {
      metrics,
      gatedCount: all.filter((m) => m.visibility === 'GATED').length,
      withheldCount: metrics.filter((m) => m.withheld).length,
      access: request ? request.status : 'NONE',
    };
  }

  private disclose(metric: FounderMetric, granted: boolean): DisclosedMetric {
    const withheld = metric.visibility === 'GATED' && !granted;
    return { ...metric, withheld, points: withheld ? [] : metric.points };
  }
}
