import { BadRequestException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { Decision } from '@agentipo/shared';
import { AUDIT_LOG, type AuditLog } from '../../audit/domain/audit.port';
import { RoundQueries } from '../../startups/application/round-queries.usecase';
import { isActionable } from '../domain/approval.policy';
import { DECISION_REPOSITORY, type DecisionRepository } from '../domain/decision.repository';
import { AgentQueries } from './agent-queries.usecase';
import { SettleDecisionStep } from './settle-decision.step';
import { SpendCeiling } from './spend-ceiling.service';

// The human half of an ADVISORY agent. Approving is not a rubber stamp: the mandate,
// the daily budget and the wallet are re-checked at approval time, because the world
// moved between the proposal and the click.
@Injectable()
export class ApproveDecisionUseCase {
  private readonly log = new Logger(ApproveDecisionUseCase.name);

  constructor(
    @Inject(DECISION_REPOSITORY) private readonly decisions: DecisionRepository,
    @Inject(AUDIT_LOG) private readonly audit: AuditLog,
    private readonly agents: AgentQueries,
    private readonly rounds: RoundQueries,
    private readonly settle: SettleDecisionStep,
    private readonly ceiling: SpendCeiling,
  ) {}

  listPending(): Promise<Decision[]> {
    return this.decisions.listPending();
  }

  async approve(decisionId: string, approvedBy: string): Promise<Decision> {
    const proposal = await this.pending(decisionId);
    const agent = await this.agents.getRecord(proposal.agentId);
    const round = await this.rounds.getRound(proposal.roundId);
    if (!agent.walletAddress) throw new BadRequestException('agent has no wallet to settle from');
    if (round.status !== 'OPEN') throw new BadRequestException(`round is ${round.status}, it no longer accepts capital`);

    const spend = await this.ceiling.evaluate(agent, round, proposal.amountUsdc);
    if (!spend.allowed) throw new BadRequestException(`no longer within policy: ${spend.reason}`);

    const decision = await this.decisions.resolve(decisionId, 'APPROVED', approvedBy);
    const investment = await this.settle.run(agent, round, decision, spend.amountUsdc);
    await this.audit.record('DECISION_APPROVED', { decisionId, approvedBy, amountUsdc: spend.amountUsdc, proposedUsdc: proposal.amountUsdc }, agent.id);
    this.log.log(`${approvedBy} approved ${agent.name}'s ${spend.amountUsdc} USDC ticket on round ${round.id}`);
    return { ...decision, investment };
  }

  async reject(decisionId: string, approvedBy: string): Promise<Decision> {
    const proposal = await this.pending(decisionId);
    const decision = await this.decisions.resolve(decisionId, 'REJECTED', approvedBy);
    await this.audit.record('DECISION_REJECTED', { decisionId, approvedBy, amountUsdc: proposal.amountUsdc }, proposal.agentId);
    return decision;
  }

  private async pending(decisionId: string): Promise<Decision> {
    const decision = await this.decisions.findById(decisionId);
    if (!decision) throw new NotFoundException(`Decision ${decisionId} not found`);
    if (!isActionable(decision.approval)) {
      throw new BadRequestException(`decision is ${decision.approval.toLowerCase()}, not awaiting approval`);
    }
    return decision;
  }
}
