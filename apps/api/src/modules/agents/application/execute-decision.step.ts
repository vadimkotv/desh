import { Inject, Injectable } from '@nestjs/common';
import type { Decision } from '@agentipo/shared';
import { AUDIT_LOG, type AuditLog } from '../../audit/domain/audit.port';
import type { RoundDetail } from '../../startups/domain/round.repository';
import type { AgentRecord } from '../domain/agent.repository';
import { approvalFor } from '../domain/approval.policy';
import { DECISION_REPOSITORY, type DecisionRepository } from '../domain/decision.repository';
import type { AcquiredReport } from './acquire-report.step';
import type { RoundVerdict } from './decide-round.step';
import { SettleDecisionStep } from './settle-decision.step';
import { NOOP_REPORTER, type RunReporter } from '../domain/run-reporter';

// Step 3: persist the decision, then either settle it (AUTONOMOUS) or file it as a
// proposal for a human to approve (ADVISORY). An ADVISORY agent does the identical
// research and spends the same data budget — it just never moves capital by itself.
@Injectable()
export class ExecuteDecisionStep {
  constructor(
    @Inject(DECISION_REPOSITORY) private readonly decisions: DecisionRepository,
    @Inject(AUDIT_LOG) private readonly audit: AuditLog,
    private readonly settle: SettleDecisionStep,
  ) {}

  async run(agent: AgentRecord, round: RoundDetail, acquired: AcquiredReport, verdict: RoundVerdict, reporter: RunReporter = NOOP_REPORTER): Promise<Decision> {
    const { engine, ...rest } = verdict;
    const approval = approvalFor(agent.mode, verdict.action);
    // Re-running an advisory agent on a round it already has a proposal for must not
    // queue the same ticket again — the human is looking at one decision, not three.
    if (approval === 'PENDING') {
      const open = await this.decisions.findPendingFor(agent.id, round.id);
      if (open) return open;
    }
    const decision = await this.decisions.create({
      ...rest,
      agentId: agent.id,
      roundId: round.id,
      reportId: acquired.report.id,
      engine,
      dataPaymentTxId: acquired.paymentTxId,
      approval,
    });
    await this.audit.record(
      'DECISION_MADE',
      { decisionId: decision.id, roundId: round.id, action: decision.action, amountUsdc: decision.amountUsdc, engine, approval, reasoning: decision.reasoning },
      agent.id,
    );

    if (approval === 'PENDING') {
      reporter.emit('approval.requested', { decisionId: decision.id, amountUsdc: decision.amountUsdc, agent: agent.name });
      await this.audit.record('APPROVAL_REQUESTED', { decisionId: decision.id, roundId: round.id, amountUsdc: decision.amountUsdc }, agent.id);
      return decision;
    }
    if (decision.action !== 'INVEST' || !agent.walletAddress) return decision;

    const investment = await this.settle.run(agent, round, decision, decision.amountUsdc, reporter);
    return { ...decision, investment };
  }
}
