import { Inject, Injectable, Logger } from '@nestjs/common';
import type { DueDiligenceReport } from '@agentipo/shared';
import { CollectDataRoomUseCase } from '../../data-room/application/collect-data-room.usecase';
import { LatestSignalsQuery } from '../../data-room/application/latest-signals.query';
import { RoundQueries } from '../../startups/application/round-queries.usecase';
import { REPORT_REPOSITORY, type ReportRepository } from '../domain/report.repository';
import { GenerateReportUseCase } from './generate-report.usecase';

// Paying consumers always get a report: if none exists yet, collect the data room
// (when no snapshots exist) and generate one on demand.
@Injectable()
export class EnsureReportUseCase {
  private readonly log = new Logger(EnsureReportUseCase.name);

  constructor(
    @Inject(REPORT_REPOSITORY) private readonly reports: ReportRepository,
    private readonly generate: GenerateReportUseCase,
    private readonly collect: CollectDataRoomUseCase,
    private readonly signals: LatestSignalsQuery,
    private readonly rounds: RoundQueries,
  ) {}

  async execute(roundId: string): Promise<DueDiligenceReport> {
    const existing = await this.reports.latest(roundId);
    if (existing) return existing;

    const round = await this.rounds.getRound(roundId);
    if ((await this.signals.execute(round.startupId)).length === 0) {
      this.log.log(`no data-room snapshots for ${round.startup.name}; collecting before first report`);
      await this.collect.execute(round.startupId);
    }
    return this.generate.execute(roundId);
  }
}
