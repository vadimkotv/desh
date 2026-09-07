import type { Finding, Signal } from '@agentipo/shared';
import type { EvaluationContext, SignalEvaluator } from './evaluator.port';
import { SignalMap } from './signal-map';

export interface DraftReport {
  score: number;
  dataCoverage: number;
  findings: Finding[];
  signals: Signal[];
  summary: string;
}

// Runs every evaluator and folds the findings into one weighted score.
// Unknown categories are excluded from the score but lower `dataCoverage`, so an
// agent can tell "bad startup" apart from "we could not see enough".
export function buildReport(
  evaluators: SignalEvaluator[],
  signals: Signal[],
  round: EvaluationContext['round'],
): DraftReport {
  const map = new SignalMap(signals);
  const findings = evaluators.map((e) => e.evaluate({ signals: map, round }));

  const known = findings.filter((f) => f.verdict !== 'unknown');
  const totalWeight = findings.reduce((s, f) => s + f.weight, 0);
  const knownWeight = known.reduce((s, f) => s + f.weight, 0);
  const score = knownWeight === 0 ? 0 : known.reduce((s, f) => s + f.score * f.weight, 0) / knownWeight;

  return {
    score: Math.round(score * 10) / 10,
    dataCoverage: totalWeight === 0 ? 0 : Math.round((knownWeight / totalWeight) * 100) / 100,
    findings,
    signals: map.all(),
    summary: summarize(findings, score, knownWeight / Math.max(totalWeight, 1e-9)),
  };
}

function summarize(findings: Finding[], score: number, coverage: number): string {
  const known = findings.filter((f) => f.verdict !== 'unknown').sort((a, b) => b.score - a.score);
  const strengths = known.filter((f) => f.verdict === 'strong').map((f) => f.category);
  const weaknesses = known.filter((f) => f.verdict === 'weak').map((f) => f.category);
  const parts = [`Composite score ${score.toFixed(0)}/100 with ${(coverage * 100).toFixed(0)}% data coverage.`];
  if (strengths.length) parts.push(`Strong: ${strengths.join(', ')}.`);
  if (weaknesses.length) parts.push(`Weak: ${weaknesses.join(', ')}.`);
  const unknown = findings.filter((f) => f.verdict === 'unknown').map((f) => f.category);
  if (unknown.length) parts.push(`No data for: ${unknown.join(', ')}.`);
  return parts.join(' ');
}
