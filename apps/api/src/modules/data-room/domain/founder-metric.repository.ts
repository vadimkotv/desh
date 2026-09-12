import type { AccessStatus, AccessRequest, FounderMetric, UpsertMetric } from '@agentipo/shared';

export const FOUNDER_METRIC_REPOSITORY = Symbol('FOUNDER_METRIC_REPOSITORY');
export const ACCESS_REQUEST_REPOSITORY = Symbol('ACCESS_REQUEST_REPOSITORY');

export interface FounderMetricRepository {
  upsert(startupId: string, input: UpsertMetric): Promise<FounderMetric>;
  listByStartup(startupId: string): Promise<FounderMetric[]>;
  remove(startupId: string, key: string): Promise<void>;
}

export interface AccessRequestRepository {
  // Idempotent: an agent asking twice re-uses its open request rather than piling up.
  request(startupId: string, agentId: string, reason: string): Promise<AccessRequest>;
  find(startupId: string, agentId: string): Promise<AccessRequest | null>;
  findById(id: string): Promise<AccessRequest | null>;
  listByStartup(startupId: string): Promise<AccessRequest[]>;
  listPending(): Promise<AccessRequest[]>;
  decide(id: string, status: AccessStatus): Promise<AccessRequest>;
}
