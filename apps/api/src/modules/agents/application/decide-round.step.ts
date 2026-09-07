import { Injectable, Logger } from '@nestjs/common';
import type { DecisionVerdict, DueDiligenceReport } from '@agentipo/shared';
import { Agent0Client } from '../../data-room/infrastructure/graph-agent0/agent0.client';
import { evaluateSpend } from '../../settlement/domain/spending-policy';
import { SubmitInvestmentUseCase } from '../../settlement/application/submit-investment.usecase';
import { WalletBalanceQuery } from '../../settlement/application/wallet-balance.query';
import type { RoundDetail } from '../../startups/domain/round.repository';
import type { AgentRecord } from '../domain/agent.repository';
import { mandateGate } from '../domain/mandate.gate';
import { DecisionEngineResolver } from '../infrastructure/engines/decision-engine.resolver';

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
    private readonly investments: SubmitInvestmentUseCase,
    private readonly balances: WalletBalanceQuery,
    private readonly agent0: Agent0Client,
  ) {}

  async run(agent: AgentRecord, round: RoundDetail, report: DueDiligenceReport): Promise<RoundVerdict> {
    const gate = mandateGate(agent.mandate, report);
    if (!gate.pass) {
      return { engine: 'mandate-gate', action: 'PASS', amountUsdc: 0, confidence: 1, reasoning: gate.reason, keyRisks: [] };
    }

    const spend = evaluateSpend({
      mandate: agent.mandate,
      round,
      proposedUsdc: agent.mandate.maxTicketUsdc,
      spentTodayUsdc: await this.investments.spentToday(agent.id),
      walletBalanceUsdc: await this.balanceOf(agent),
    });
    if (!spend.allowed) {
      return { engine: 'spending-policy', action: 'WATCH', amountUsdc: 0, confidence: 1, reasoning: spend.reason, keyRisks: [] };
    }

    const engine = this.engines.resolve();
    const verdict = await engine.decide({
      mandate: agent.mandate, round, report, maxAmountUsdc: spend.amountUsdc, selfReputation: await this.reputationOf(agent),
    });
    const amountUsdc = verdict.action === 'INVEST' ? Math.min(verdict.amountUsdc, spend.amountUsdc) : 0;
    const action = amountUsdc < round.minTicketUsdc && verdict.action === 'INVEST' ? 'WATCH' : verdict.action;
    return { ...verdict, action, amountUsdc: action === 'INVEST' ? amountUsdc : 0, engine: engine.name };
  }

  private async balanceOf(agent: AgentRecord): Promise<number | undefined> {
    if (!agent.walletAddress) return undefined;
    try {
      return await this.balances.usdcBalance(agent.walletAddress);
    } catch (err) {
      this.log.warn(`balance read failed for ${agent.walletAddress}: ${(err as Error).message}`);
      return undefined;
    }
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
