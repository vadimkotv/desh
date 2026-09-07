import { z } from 'zod';
import { SignalSchema } from './signals.js';

// One evaluator inspects a subset of signals and produces a scored finding.
export const FindingSchema = z.object({
  category: z.string(), // "distribution", "activity", "treasury", "liquidity", "reputation", "traction"
  score: z.number().min(0).max(100),
  weight: z.number().min(0).max(1),
  verdict: z.enum(['strong', 'ok', 'weak', 'unknown']),
  rationale: z.string(),
  signalKeys: z.array(z.string()),
});
export type Finding = z.infer<typeof FindingSchema>;

export const DueDiligenceReportSchema = z.object({
  id: z.string().uuid(),
  roundId: z.string().uuid(),
  score: z.number().min(0).max(100),
  findings: z.array(FindingSchema),
  signals: z.array(SignalSchema),
  summary: z.string(),
  dataCoverage: z.number().min(0).max(1), // share of expected signals actually observed
  createdAt: z.string(),
});
export type DueDiligenceReport = z.infer<typeof DueDiligenceReportSchema>;

// Free tier: score + summary only. Premium (x402-gated): full findings and raw signals.
export const DueDiligencePreviewSchema = DueDiligenceReportSchema.pick({
  id: true,
  roundId: true,
  score: true,
  summary: true,
  dataCoverage: true,
  createdAt: true,
});
export type DueDiligencePreview = z.infer<typeof DueDiligencePreviewSchema>;
