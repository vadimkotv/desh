import { Inject, Injectable } from '@nestjs/common';
import type { Signal } from '@agentipo/shared';
import { AppConfig } from '../../../config/app-config';
import { SNAPSHOT_REPOSITORY, type SnapshotRepository } from '../domain/snapshot.repository';

@Injectable()
export class LatestSignalsQuery {
  constructor(
    @Inject(SNAPSHOT_REPOSITORY) private readonly snapshots: SnapshotRepository,
    private readonly config: AppConfig,
  ) {}

  // Fixture snapshots written while DEMO_SIGNALS was on must not outlive the flag: once
  // live providers are configured, only their signals count.
  async execute(startupId: string): Promise<Signal[]> {
    const records = await this.snapshots.latestPerSource(startupId);
    const fixtures = this.config.env.DEMO_SIGNALS === 'true';
    return records.filter((r) => fixtures || r.source !== 'demo-fixture').flatMap((r) => r.signals);
  }
}
