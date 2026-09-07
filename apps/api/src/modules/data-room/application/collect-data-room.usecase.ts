import { Inject, Injectable, Logger } from '@nestjs/common';
import type { Signal } from '@agentipo/shared';
import { RoundQueries } from '../../startups/application/round-queries.usecase';
import { DATA_PROVIDERS, type DataProvider } from '../domain/data-provider.port';
import { SNAPSHOT_REPOSITORY, type SnapshotRepository } from '../domain/snapshot.repository';

export interface CollectResult {
  signals: Signal[];
  sources: { source: string; ok: boolean; count: number; error?: string }[];
}

// Fan-out over every enabled provider; each source is snapshotted independently so a
// failing API never hides the data we did get.
@Injectable()
export class CollectDataRoomUseCase {
  private readonly log = new Logger(CollectDataRoomUseCase.name);

  constructor(
    @Inject(DATA_PROVIDERS) private readonly providers: DataProvider[],
    @Inject(SNAPSHOT_REPOSITORY) private readonly snapshots: SnapshotRepository,
    private readonly rounds: RoundQueries,
  ) {}

  async execute(startupId: string): Promise<CollectResult> {
    const startup = await this.rounds.getStartup(startupId);
    const ctx = { startup };
    const active = this.providers.filter((p) => p.supports(ctx));
    const settled = await Promise.allSettled(active.map((p) => p.collect(ctx)));

    const result: CollectResult = { signals: [], sources: [] };
    for (const [i, outcome] of settled.entries()) {
      const provider = active[i] as DataProvider;
      if (outcome.status === 'fulfilled') {
        await this.snapshots.save(startupId, { source: provider.source, signals: outcome.value });
        result.signals.push(...outcome.value);
        result.sources.push({ source: provider.source, ok: true, count: outcome.value.length });
      } else {
        const error = outcome.reason instanceof Error ? outcome.reason.message : String(outcome.reason);
        this.log.warn(`${provider.source} failed for ${startupId}: ${error}`);
        await this.snapshots.save(startupId, { source: provider.source, signals: [], error });
        result.sources.push({ source: provider.source, ok: false, count: 0, error });
      }
    }
    return result;
  }
}
