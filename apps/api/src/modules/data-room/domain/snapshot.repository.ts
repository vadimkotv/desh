import type { Signal, SignalSource } from '@agentipo/shared';

export const SNAPSHOT_REPOSITORY = Symbol('SNAPSHOT_REPOSITORY');

export interface SnapshotRecord {
  source: SignalSource;
  signals: Signal[];
  error?: string;
  fetchedAt: string;
}

export interface SnapshotRepository {
  save(startupId: string, record: Omit<SnapshotRecord, 'fetchedAt'>): Promise<void>;
  latestPerSource(startupId: string): Promise<SnapshotRecord[]>;
}
