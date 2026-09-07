import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { DueDiligencePreview, DueDiligenceReport } from '@agentipo/shared';
import { REPORT_REPOSITORY, type ReportRepository } from '../domain/report.repository';

@Injectable()
export class ReportQueries {
  constructor(@Inject(REPORT_REPOSITORY) private readonly reports: ReportRepository) {}

  async full(roundId: string): Promise<DueDiligenceReport> {
    const report = await this.reports.latest(roundId);
    if (!report) throw new NotFoundException(`No due-diligence report for round ${roundId}`);
    return report;
  }

  async preview(roundId: string): Promise<DueDiligencePreview> {
    const { id, score, summary, dataCoverage, createdAt } = await this.full(roundId);
    return { id, roundId, score, summary, dataCoverage, createdAt };
  }

  history(roundId: string) {
    return this.reports.history(roundId);
  }
}
