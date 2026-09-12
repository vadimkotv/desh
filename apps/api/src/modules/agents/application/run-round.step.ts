import { Injectable, Logger } from '@nestjs/common';
import type { Decision } from '@agentipo/shared';
import type { RoundDetail } from '../../startups/domain/round.repository';
import type { AgentRecord } from '../domain/agent.repository';
import type { RunReporter } from '../domain/run-reporter';
import { AcquireReportStep } from './acquire-report.step';
import { DecideRoundStep } from './decide-round.step';
import { ExecuteDecisionStep } from './execute-decision.step';

@Injectable()
export class RunRoundStep {
  private readonly log = new Logger(RunRoundStep.name);

  constructor(
    private readonly acquire: AcquireReportStep,
    private readonly decide: DecideRoundStep,
    private readonly execute: ExecuteDecisionStep,
  ) {}

  async run(
    agent: AgentRecord,
    round: RoundDetail,
    reporter: RunReporter,
  ): Promise<Decision | null> {
    reporter.emit('round.discovered', {
      startup: round.startup.name,
      targetUsdc: round.targetUsdc,
      raisedUsdc: round.raisedUsdc,
      equityBps: round.equityBps,
    });
    try {
      const acquired = await this.acquire.run(agent, round.id, reporter);
      const verdict = await this.decide.run(agent, round, acquired.report, reporter);
      const decision = await this.execute.run(agent, round, acquired, verdict, reporter);
      reporter.emit('round.done', {
        decisionId: decision.id,
        action: decision.action,
        amountUsdc: decision.amountUsdc,
      });
      return decision;
    } catch (error) {
      const message = (error as Error).message;
      this.log.error(`round ${round.id} failed for agent ${agent.id}: ${message}`);
      reporter.emit('round.failed', { error: message });
      return null;
    }
  }
}
