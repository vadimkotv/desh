import { Inject, Injectable, Logger } from '@nestjs/common';
import { type DueDiligenceReport, type Signal, SignalKeys } from '@agentipo/shared';
import { GrowthSignalsQuery } from '../../data-room/application/growth-signals.query';
import { LatestSignalsQuery } from '../../data-room/application/latest-signals.query';
import { signal } from '../../data-room/domain/data-provider.port';
import { ESCROW_READER, type EscrowReader } from '../../settlement/domain/escrow-reader.port';
import { RoundQueries } from '../../startups/application/round-queries.usecase';
import { SIGNAL_EVALUATORS, type SignalEvaluator } from '../domain/evaluator.port';
import { buildReport } from '../domain/report.builder';
import { REPORT_REPOSITORY, type ReportRepository } from '../domain/report.repository';

// Startup-level signals come from the data-room snapshots (The Graph) and the
// founder's own public metrics read as trajectories; round-level traction is read
// live from the Arc escrow at generation time.
@Injectable()
export class GenerateReportUseCase {
  private readonly log = new Logger(GenerateReportUseCase.name);

  constructor(
    @Inject(SIGNAL_EVALUATORS) private readonly evaluators: SignalEvaluator[],
    @Inject(REPORT_REPOSITORY) private readonly reports: ReportRepository,
    @Inject(ESCROW_READER) private readonly escrow: EscrowReader | null,
    private readonly rounds: RoundQueries,
    private readonly latestSignals: LatestSignalsQuery,
    private readonly growth: GrowthSignalsQuery,
  ) {}

  async execute(roundId: string): Promise<DueDiligenceReport> {
    const round = await this.rounds.getRound(roundId);
    const signals = await this.latestSignals.execute(round.startupId);
    signals.push(...(await this.growth.execute(round.startupId)));
    signals.push(...(await this.escrowSignals(round.onchainRoundId)));
    const draft = buildReport(this.evaluators, signals, round);
    this.log.log(`report for round ${roundId}: score=${draft.score} coverage=${draft.dataCoverage}`);
    return this.reports.save(roundId, draft);
  }

  private async escrowSignals(onchainRoundId: number | null): Promise<Signal[]> {
    if (!this.escrow || onchainRoundId === null) return [];
    try {
      const r = await this.escrow.getRound(onchainRoundId);
      const meta = { escrowAddress: r.escrowAddress, onchainRoundId, status: r.status };
      return [
        signal('onchain-arc', SignalKeys.escrowRaisedUsdc, r.raisedUsdc, 'usd', meta),
        signal('onchain-arc', SignalKeys.escrowInvestorCount, r.investorCount, 'count', meta),
      ];
    } catch (err) {
      this.log.warn(`escrow read failed for round ${onchainRoundId}: ${(err as Error).message}`);
      return [];
    }
  }
}
