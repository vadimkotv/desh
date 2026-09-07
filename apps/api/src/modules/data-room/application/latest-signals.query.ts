import { Inject, Injectable } from '@nestjs/common';
import type { Signal } from '@agentipo/shared';
import { SNAPSHOT_REPOSITORY, type SnapshotRepository } from '../domain/snapshot.repository';

@Injectable()
export class LatestSignalsQuery {
  constructor(@Inject(SNAPSHOT_REPOSITORY) private readonly snapshots: SnapshotRepository) {}

  async execute(startupId: string): Promise<Signal[]> {
    const records = await this.snapshots.latestPerSource(startupId);
    return records.flatMap((r) => r.signals);
  }
}
