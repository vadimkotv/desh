import { Injectable, Logger } from '@nestjs/common';
import type { Decision } from '@agentipo/shared';
import { randomUUID } from 'node:crypto';
import { RoundQueries } from '../../startups/application/round-queries.usecase';
import type { RoundDetail } from '../../startups/domain/round.repository';
import type { AgentRecord } from '../domain/agent.repository';
import { AgentQueries } from './agent-queries.usecase';
import { RunEventBus } from './run-event.bus';
import { RunRoundStep } from './run-round.step';

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
    private readonly runRound: RunRoundStep,
    private readonly events: RunEventBus,
  ) {}

  // Fire-and-forget variant: returns the runId immediately; progress streams over SSE.
  start(agentId: string, options: RunOptions = {}): string {
    const runId = randomUUID();
    void this.run(agentId, options, runId).catch((err) =>
      this.log.error(`run ${runId} failed: ${err.message}`),
    );
    return runId;
  }

  async run(agentId: string, options: RunOptions = {}, runId = randomUUID()): Promise<Decision[]> {
    const agent = await this.agents.getRecord(agentId);
    const candidates = await this.discover(agent, options);
    return this.process(agent, candidates, options, runId);
  }

  async runPending(agentId: string): Promise<boolean> {
    const agent = await this.agents.getRecord(agentId);
    const candidates = await this.rounds.openUndecidedForAgent(agent.mandate.sectors, agent.id);
    if (candidates.length === 0) return false;
    await this.process(agent, candidates.slice(0, 1), {}, randomUUID());
    return true;
  }

  private async process(
    agent: AgentRecord,
    candidates: RoundDetail[],
    options: RunOptions,
    runId: string,
  ): Promise<Decision[]> {
    const reporter = this.events.reporter(runId, agent.id);
    reporter.emit('run.started', {
      agent: agent.name,
      sectors: agent.mandate.sectors,
      roundId: options.roundId ?? null,
    });
    this.log.log(`agent ${agent.name}: evaluating ${candidates.length} round(s)`);
    const decisions: Decision[] = [];
    for (const round of candidates) {
      const decision = await this.runRound.run(agent, round, reporter.forRound(round.id));
      if (decision) decisions.push(decision);
    }
    reporter.emit('run.completed', {
      decisions: decisions.length,
      invested: decisions.filter((d) => d.action === 'INVEST').length,
    });
    return decisions;
  }

  private async discover(agent: AgentRecord, { roundId }: RunOptions): Promise<RoundDetail[]> {
    if (roundId) return [await this.rounds.getRound(roundId)];
    return this.rounds.openUndecidedForAgent(agent.mandate.sectors, agent.id);
  }
}
