import type { DueDiligenceReport } from '@agentipo/shared';
import type { DraftReport } from './report.builder';

export const REPORT_REPOSITORY = Symbol('REPORT_REPOSITORY');

export interface ReportRepository {
  save(roundId: string, draft: DraftReport): Promise<DueDiligenceReport>;
  latest(roundId: string): Promise<DueDiligenceReport | null>;
}
