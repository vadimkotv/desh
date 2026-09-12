import { Injectable, Logger } from '@nestjs/common';
import type { DecisionVerdict, DueDiligenceReport } from '@agentipo/shared';
import { Agent0Client } from '../../data-room/infrastructure/graph-agent0/agent0.client';
import type { RoundDetail } from '../../startups/domain/round.repository';
import type { AgentRecord } from '../domain/agent.repository';
import { mandateGate } from '../domain/mandate.gate';
import { NOOP_REPORTER, type RunReporter } from '../domain/run-reporter';
import { DecisionEngineResolver } from '../infrastructure/engines/decision-engine.resolver';
import { SpendCeiling } from './spend-ceiling.service';

export interface RoundVerdict extends DecisionVerdict {
  engine: string;
}

// Step 2: gate → derive the policy ceiling → let the engine reason → clamp again.
// The engine only ever sees an amount it is allowed to spend.
@Injectable()
export class DecideRoundStep {
  private readonly log = new Logger(DecideRoundStep.name);

  constructor(
    private readonly engines: DecisionEngineResolver,
    private readonly ceiling: SpendCeiling,
    private readonly agent0: Agent0Client,
  ) {}

  async run(agent: AgentRecord, round: RoundDetail, report: DueDiligenceReport, reporter: RunReporter = NOOP_REPORTER): Promise<RoundVerdict> {
    const gate = mandateGate(agent.mandate, report);
    reporter.emit(gate.pass ? 'gate.passed' : 'gate.failed', { reason: gate.reason, score: report.score, minScore: agent.mandate.minScore });
    if (!gate.pass) {
      return { engine: 'mandate-gate', action: 'PASS', amountUsdc: 0, confidence: 1, reasoning: gate.reason, keyRisks: [] };
    }

    const spend = await this.ceiling.evaluate(agent, round);
    reporter.emit('policy.evaluated', { allowed: spend.allowed, ceilingUsdc: spend.amountUsdc, reason: spend.reason });
    if (!spend.allowed) {
      return { engine: 'spending-policy', action: 'WATCH', amountUsdc: 0, confidence: 1, reasoning: spend.reason, keyRisks: [] };
    }

    const engine = this.engines.resolve();
    reporter.emit('engine.deciding', { engine: engine.name, maxAmountUsdc: spend.amountUsdc });
    const verdict = await engine.decide({
      mandate: agent.mandate, round, report, maxAmountUsdc: spend.amountUsdc, selfReputation: await this.reputationOf(agent),
    });
    const amountUsdc = verdict.action === 'INVEST' ? Math.min(verdict.amountUsdc, spend.amountUsdc) : 0;
    const action = amountUsdc < round.minTicketUsdc && verdict.action === 'INVEST' ? 'WATCH' : verdict.action;
    const bounded = { ...verdict, action, amountUsdc: action === 'INVEST' ? amountUsdc : 0, engine: engine.name };
    reporter.emit('engine.decided', { action, amountUsdc: bounded.amountUsdc, confidence: verdict.confidence, engine: engine.name, reasoning: verdict.reasoning, keyRisks: verdict.keyRisks });
    return bounded;
  }

  private async reputationOf(agent: AgentRecord) {
    if (!agent.erc8004AgentId || !agent.erc8004ChainId || !this.agent0.enabled) return null;
    try {
      return await this.agent0.reputationOf(agent.erc8004ChainId, agent.erc8004AgentId);
    } catch {
      return null;
    }
  }
}
