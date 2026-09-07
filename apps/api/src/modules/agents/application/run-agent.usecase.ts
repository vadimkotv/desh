import { Injectable, Logger } from '@nestjs/common';
import type { Decision } from '@agentipo/shared';
import { randomUUID } from 'node:crypto';
import { RoundQueries } from '../../startups/application/round-queries.usecase';
import type { RoundDetail } from '../../startups/domain/round.repository';
import type { AgentRecord } from '../domain/agent.repository';
import type { RunReporter } from '../domain/run-reporter';
import { AcquireReportStep } from './acquire-report.step';
import { AgentQueries } from './agent-queries.usecase';
import { DecideRoundStep } from './decide-round.step';
import { ExecuteDecisionStep } from './execute-decision.step';
import { RunEventBus } from './run-event.bus';

export interface RunOptions {
  roundId?: string;
}

// The autonomous loop: discover → buy data → decide → settle → audit, per open round.
// Each round is isolated: one failure is reported, the run continues.
@Injectable()
export class RunAgentUseCase {
  private readonly log = new Logger(RunAgentUseCase.name);

  constructor(
    private readonly agents: AgentQueries,
    private readonly rounds: RoundQueries,
    private readonly acquire: AcquireReportStep,
    private readonly decide: DecideRoundStep,
    private readonly execute: ExecuteDecisionStep,
    private readonly events: RunEventBus,
  ) {}

  // Fire-and-forget variant: returns the runId immediately; progress streams over SSE.
  start(agentId: string, options: RunOptions = {}): string {
    const runId = randomUUID();
    void this.run(agentId, options, runId).catch((err) => this.log.error(`run ${runId} failed: ${err.message}`));
    return runId;
  }

  async run(agentId: string, options: RunOptions = {}, runId = randomUUID()): Promise<Decision[]> {
    const agent = await this.agents.getRecord(agentId);
    const reporter = this.events.reporter(runId, agent.id);
    reporter.emit('run.started', { agent: agent.name, sectors: agent.mandate.sectors, roundId: options.roundId ?? null });

    const candidates = await this.discover(agent, options);
    this.log.log(`agent ${agent.name}: evaluating ${candidates.length} round(s)`);
    const decisions: Decision[] = [];
    for (const round of candidates) {
      const r = reporter.forRound(round.id);
      r.emit('round.discovered', { startup: round.startup.name, targetUsdc: round.targetUsdc, raisedUsdc: round.raisedUsdc });
      try {
        const decision = await this.evaluate(agent, round, r);
        decisions.push(decision);
        r.emit('round.done', { decisionId: decision.id, action: decision.action, amountUsdc: decision.amountUsdc });
      } catch (err) {
        const message = (err as Error).message;
        this.log.error(`round ${round.id} failed for agent ${agent.id}: ${message}`);
        r.emit('round.failed', { error: message });
      }
    }
    reporter.emit('run.completed', { decisions: decisions.length, invested: decisions.filter((d) => d.action === 'INVEST').length });
    return decisions;
  }

  private async discover(agent: AgentRecord, { roundId }: RunOptions): Promise<RoundDetail[]> {
    if (roundId) return [await this.rounds.getRound(roundId)];
    return this.rounds.openForSectors(agent.mandate.sectors);
  }

  private async evaluate(agent: AgentRecord, round: RoundDetail, reporter: RunReporter): Promise<Decision> {
    const acquired = await this.acquire.run(agent, round.id, reporter);
    const verdict = await this.decide.run(agent, round, acquired.report, reporter);
    return this.execute.run(agent, round, acquired, verdict, reporter);
  }
}
