import { Inject, Injectable } from '@nestjs/common';
import type { Decision, Investment } from '@agentipo/shared';
import { AUDIT_LOG, type AuditLog } from '../../audit/domain/audit.port';
import { SubmitInvestmentUseCase } from '../../settlement/application/submit-investment.usecase';
import { RoundQueries } from '../../startups/application/round-queries.usecase';
import type { RoundDetail } from '../../startups/domain/round.repository';
import type { AgentRecord } from '../domain/agent.repository';
import { NOOP_REPORTER, type RunReporter } from '../domain/run-reporter';

// Moves the money for a decision that is cleared to settle — either because the agent
// is autonomous, or because a human approved its proposal. Both paths land here, so
// the escrow, the audit trail and the round's raised total stay consistent.
@Injectable()
export class SettleDecisionStep {
  constructor(
    @Inject(AUDIT_LOG) private readonly audit: AuditLog,
    private readonly investments: SubmitInvestmentUseCase,
    private readonly rounds: RoundQueries,
  ) {}

  async run(
    agent: AgentRecord,
    round: RoundDetail,
    decision: Decision,
    amountUsdc: number,
    reporter: RunReporter = NOOP_REPORTER,
  ): Promise<Investment> {
    await this.audit.record('INVESTMENT_SUBMITTED', { decisionId: decision.id, amountUsdc }, agent.id);
    reporter.emit('settlement.submitted', { decisionId: decision.id, amountUsdc, wallet: agent.walletAddress, kind: agent.walletKind });

    const investment = await this.investments.execute({
      decisionId: decision.id,
      agentId: agent.id,
      roundId: round.id,
      onchainRoundId: round.onchainRoundId,
      amountUsdc,
      wallet: { kind: agent.walletKind, address: agent.walletAddress as string, keyIndex: agent.keyIndex, circleWalletId: agent.circleWalletId },
    });
    const confirmed = investment.status === 'CONFIRMED';
    if (confirmed) await this.rounds.recordRaised(round.id, investment.amountUsdc);

    reporter.emit(confirmed ? 'settlement.confirmed' : 'settlement.failed', { investmentId: investment.id, txHash: investment.txHash, chainId: investment.chainId, amountUsdc: investment.amountUsdc, error: investment.error });
    await this.audit.record(
      confirmed ? 'INVESTMENT_CONFIRMED' : 'INVESTMENT_FAILED',
      { decisionId: decision.id, investmentId: investment.id, txHash: investment.txHash, chainId: investment.chainId, error: investment.error },
      agent.id,
    );
    return investment;
  }
}
