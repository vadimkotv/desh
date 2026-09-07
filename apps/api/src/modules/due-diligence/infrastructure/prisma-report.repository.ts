import { Injectable } from '@nestjs/common';
import type { DueDiligenceReport, Finding, Signal } from '@agentipo/shared';
import type { DueDiligenceReport as DbReport } from '../../../generated/prisma/client';
import { asJson } from '../../../common/prisma/json';
import { PrismaService } from '../../../common/prisma/prisma.service';
import type { DraftReport } from '../domain/report.builder';
import type { ReportHistoryPoint, ReportRepository } from '../domain/report.repository';

const toReport = (r: DbReport): DueDiligenceReport => ({
  id: r.id,
  roundId: r.roundId,
  score: r.score,
  dataCoverage: r.dataCoverage,
  summary: r.summary,
  findings: r.findings as Finding[],
  signals: r.signals as Signal[],
  createdAt: r.createdAt.toISOString(),
});

@Injectable()
export class PrismaReportRepository implements ReportRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(roundId: string, draft: DraftReport): Promise<DueDiligenceReport> {
    const row = await this.prisma.dueDiligenceReport.create({ data: { roundId, ...draft, findings: asJson(draft.findings), signals: asJson(draft.signals) } });
    return toReport(row);
  }

  async latest(roundId: string): Promise<DueDiligenceReport | null> {
    const row = await this.prisma.dueDiligenceReport.findFirst({ where: { roundId }, orderBy: { createdAt: 'desc' } });
    return row ? toReport(row) : null;
  }

  async history(roundId: string, limit = 50): Promise<ReportHistoryPoint[]> {
    const rows = await this.prisma.dueDiligenceReport.findMany({
      where: { roundId },
      orderBy: { createdAt: 'asc' },
      take: limit,
      select: { id: true, score: true, dataCoverage: true, createdAt: true },
    });
    return rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }));
  }
}
