import { Injectable } from '@nestjs/common';
import type { DecisionVerdict } from '@agentipo/shared';
import { round6 } from '../../../../common/money';
import type { DecisionEngine, DecisionInput } from '../../domain/decision-engine.port';

// Deterministic fallback engine. Sizes the ticket from how far the score exceeds the
// mandate floor; always available, so the platform demos even without an LLM key.
@Injectable()
export class RulesDecisionEngine implements DecisionEngine {
  readonly name = 'rules-v1';

  available(): boolean {
    return true;
  }

  async decide({ mandate, report, maxAmountUsdc }: DecisionInput): Promise<DecisionVerdict> {
    const headroom = (report.score - mandate.minScore) / Math.max(100 - mandate.minScore, 1);
    const weak = report.findings.filter((f) => f.verdict === 'weak').map((f) => f.category);
    const unknown = report.findings.filter((f) => f.verdict === 'unknown').map((f) => f.category);
    const keyRisks = [...weak.map((c) => `weak ${c}`), ...unknown.map((c) => `no data on ${c}`)];

    if (headroom <= 0 || weak.length >= 2) {
      return {
        action: weak.length >= 2 ? 'PASS' : 'WATCH',
        amountUsdc: 0,
        confidence: 0.6,
        reasoning: `Score ${report.score} gives no headroom over mandate floor ${mandate.minScore}; weak: ${weak.join(', ') || 'none'}.`,
        keyRisks,
      };
    }
    const sizing = Math.min(1, 0.25 + headroom) * report.dataCoverage;
    return {
      action: 'INVEST',
      amountUsdc: round6(maxAmountUsdc * sizing),
      confidence: Math.min(0.95, 0.5 + headroom / 2),
      reasoning: `Score ${report.score} exceeds floor ${mandate.minScore} with ${(report.dataCoverage * 100).toFixed(0)}% coverage; sizing ${(sizing * 100).toFixed(0)}% of the ${maxAmountUsdc} USDC ceiling.`,
      keyRisks,
    };
  }
}
