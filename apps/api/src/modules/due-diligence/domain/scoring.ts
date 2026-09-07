import type { Finding } from '@agentipo/shared';

export const clamp = (n: number, lo = 0, hi = 100): number => Math.min(hi, Math.max(lo, n));

// Logarithmic saturation: 0 → 0, `saturation` → ~100. Good for counts (holders, transfers).
export const logScore = (value: number, saturation: number): number =>
  value <= 0 ? 0 : clamp((Math.log10(1 + value) / Math.log10(1 + saturation)) * 100);

// Linear ratio score with a cap at 100.
export const ratioScore = (value: number, target: number): number =>
  target <= 0 ? 0 : clamp((value / target) * 100);

export const verdictOf = (score: number): Finding['verdict'] =>
  score >= 70 ? 'strong' : score >= 45 ? 'ok' : 'weak';

export const finding = (
  category: string,
  weight: number,
  score: number,
  rationale: string,
  signalKeys: string[],
): Finding => ({ category, weight, score: Math.round(clamp(score)), verdict: verdictOf(score), rationale, signalKeys });

export const unknownFinding = (category: string, weight: number, missing: string[]): Finding => ({
  category,
  weight,
  score: 50,
  verdict: 'unknown',
  rationale: `Not enough data: missing ${missing.join(', ')}`,
  signalKeys: missing,
});

export const fmtUsd = (n: number): string =>
  n >= 1_000_000 ? `$${(n / 1e6).toFixed(2)}M` : n >= 1_000 ? `$${(n / 1e3).toFixed(1)}k` : `$${n.toFixed(0)}`;
