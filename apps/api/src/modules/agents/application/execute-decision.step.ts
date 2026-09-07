import { Inject, Injectable } from '@nestjs/common';
import type { Decision } from '@agentipo/shared';
import { AUDIT_LOG, type AuditLog } from '../../audit/domain/audit.port';
import { SubmitInvestmentUseCase } from '../../settlement/application/submit-investment.usecase';
import { RoundQueries } from '../../startups/application/round-queries.usecase';
import type { RoundDetail } from '../../startups/domain/round.repository';
import type { AgentRecord } from '../domain/agent.repository';
import { DECISION_REPOSITORY, type DecisionRepository } from '../domain/decision.repository';
import type { AcquiredReport } from './acquire-report.step';
import type { RoundVerdict } from './decide-round.step';

// Step 3: persist the decision, then (for INVEST) settle USDC into the Arc escrow and
// mirror every state change to the audit log / HCS.
@Injectable()
export class ExecuteDecisionStep {
  constructor(
    @Inject(DECISION_REPOSITORY) private readonly decisions: DecisionRepository,
    @Inject(AUDIT_LOG) private readonly audit: AuditLog,
    private readonly investments: SubmitInvestmentUseCase,
    private readonly rounds: RoundQueries,
  ) {}

  async run(agent: AgentRecord, round: RoundDetail, acquired: AcquiredReport, verdict: RoundVerdict): Promise<Decision> {
    const { engine, ...rest } = verdict;
    const decision = await this.decisions.create({
      ...rest,
      agentId: agent.id,
      roundId: round.id,
      reportId: acquired.report.id,
      engine,
      dataPaymentTxId: acquired.paymentTxId,
    });
    await this.audit.record(
      'DECISION_MADE',
      { decisionId: decision.id, roundId: round.id, action: decision.action, amountUsdc: decision.amountUsdc, engine, reasoning: decision.reasoning },
      agent.id,
    );
    if (decision.action !== 'INVEST' || !agent.walletAddress) return decision;

    await this.audit.record('INVESTMENT_SUBMITTED', { decisionId: decision.id, amountUsdc: decision.amountUsdc }, agent.id);
    const investment = await this.investments.execute({
      decisionId: decision.id,
      agentId: agent.id,
      roundId: round.id,
      onchainRoundId: round.onchainRoundId,
      amountUsdc: decision.amountUsdc,
      wallet: { kind: agent.walletKind, address: agent.walletAddress, keyIndex: agent.keyIndex, circleWalletId: agent.circleWalletId },
    });
    if (investment.status === 'CONFIRMED') await this.rounds.recordRaised(round.id, investment.amountUsdc);
    await this.audit.record(
      investment.status === 'CONFIRMED' ? 'INVESTMENT_CONFIRMED' : 'INVESTMENT_FAILED',
      { decisionId: decision.id, investmentId: investment.id, txHash: investment.txHash, chainId: investment.chainId },
      agent.id,
    );
    return { ...decision, investment };
  }
}
