import { Injectable, Logger } from '@nestjs/common';
import type { Decision } from '@agentipo/shared';
import { RoundQueries } from '../../startups/application/round-queries.usecase';
import type { RoundDetail } from '../../startups/domain/round.repository';
import type { AgentRecord } from '../domain/agent.repository';
import { AcquireReportStep } from './acquire-report.step';
import { AgentQueries } from './agent-queries.usecase';
import { DecideRoundStep } from './decide-round.step';
import { ExecuteDecisionStep } from './execute-decision.step';

export interface RunOptions {
  roundId?: string;
}

// The autonomous loop: discover → buy data → decide → settle → audit, per open round.
// Each round is isolated: one failure is logged as a PASS-with-error, the run continues.
@Injectable()
export class RunAgentUseCase {
  private readonly log = new Logger(RunAgentUseCase.name);

  constructor(
    private readonly agents: AgentQueries,
    private readonly rounds: RoundQueries,
    private readonly acquire: AcquireReportStep,
    private readonly decide: DecideRoundStep,
    private readonly execute: ExecuteDecisionStep,
  ) {}

  async run(agentId: string, options: RunOptions = {}): Promise<Decision[]> {
    const agent = await this.agents.getRecord(agentId);
    const candidates = await this.discover(agent, options);
    this.log.log(`agent ${agent.name}: evaluating ${candidates.length} round(s)`);

    const decisions: Decision[] = [];
    for (const round of candidates) {
      try {
        decisions.push(await this.evaluate(agent, round));
      } catch (err) {
        this.log.error(`round ${round.id} failed for agent ${agent.id}: ${(err as Error).message}`);
      }
    }
    return decisions;
  }

  private async discover(agent: AgentRecord, { roundId }: RunOptions): Promise<RoundDetail[]> {
    if (roundId) return [await this.rounds.getRound(roundId)];
    return this.rounds.openForSectors(agent.mandate.sectors);
  }

  private async evaluate(agent: AgentRecord, round: RoundDetail): Promise<Decision> {
    const acquired = await this.acquire.run(agent, round.id);
    const verdict = await this.decide.run(agent, round, acquired.report);
    return this.execute.run(agent, round, acquired, verdict);
  }
}
