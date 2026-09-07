import type { DueDiligencePreview, Mandate } from '@agentipo/shared';

export interface GateResult {
  pass: boolean;
  reason: string;
}

// Minimum data quality an agent will tolerate before it even asks the engine.
const MIN_COVERAGE: Record<Mandate['riskTolerance'], number> = {
  conservative: 0.8,
  balanced: 0.5,
  aggressive: 0.3,
};

// Hard, non-negotiable filters from the human mandate. Cheap and deterministic, so they
// run before any LLM call and before any money moves.
export function mandateGate(mandate: Mandate, report: Pick<DueDiligencePreview, 'score' | 'dataCoverage'>): GateResult {
  if (report.dataCoverage < MIN_COVERAGE[mandate.riskTolerance]) {
    return {
      pass: false,
      reason: `data coverage ${report.dataCoverage} below ${MIN_COVERAGE[mandate.riskTolerance]} required for ${mandate.riskTolerance} mandate`,
    };
  }
  if (report.score < mandate.minScore) {
    return { pass: false, reason: `score ${report.score} below mandate minimum ${mandate.minScore}` };
  }
  return { pass: true, reason: 'passes mandate gate' };
}
