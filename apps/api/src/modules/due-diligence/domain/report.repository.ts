import type { DueDiligenceReport } from '@agentipo/shared';
import type { DraftReport } from './report.builder';

export const REPORT_REPOSITORY = Symbol('REPORT_REPOSITORY');

export interface ReportHistoryPoint {
  id: string;
  score: number;
  dataCoverage: number;
  createdAt: string;
}

export interface ReportRepository {
  save(roundId: string, draft: DraftReport): Promise<DueDiligenceReport>;
  latest(roundId: string): Promise<DueDiligenceReport | null>;
  history(roundId: string, limit?: number): Promise<ReportHistoryPoint[]>;
}
