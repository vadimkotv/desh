import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import type { Agent } from '@agentipo/shared';
import { AgentQueries } from './agent-queries.usecase';
import { RunEventBus } from './run-event.bus';
import { RunAgentUseCase } from './run-agent.usecase';

const POLL_MS = 4_000;

// Durable agent supervisor. RUNNING survives API restarts; each cycle only picks
// rounds without a prior decision from that agent, so polling stays idempotent.
@Injectable()
export class AgentRuntimeService implements OnModuleInit, OnModuleDestroy {
  private readonly log = new Logger(AgentRuntimeService.name);
  private readonly inFlight = new Set<string>();
  private timer?: NodeJS.Timeout;

  constructor(
    private readonly agents: AgentQueries,
    private readonly runner: RunAgentUseCase,
    private readonly events: RunEventBus,
  ) {}

  onModuleInit(): void {
    this.timer = setInterval(() => void this.tick(), POLL_MS);
    void this.tick();
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  async start(agentId: string): Promise<Agent> {
    const agent = await this.agents.setStatus(agentId, 'RUNNING');
    this.events.announce(agentId, 'agent.started', { name: agent.name, status: agent.status });
    this.queue(agentId);
    return agent;
  }

  async pause(agentId: string): Promise<Agent> {
    const agent = await this.agents.setStatus(agentId, 'PAUSED');
    this.events.announce(agentId, 'agent.paused', { name: agent.name, status: agent.status });
    return agent;
  }

  private async tick(): Promise<void> {
    try {
      const agents = await this.agents.listRecords();
      for (const agent of agents) if (agent.status === 'RUNNING') this.queue(agent.id);
    } catch (error) {
      this.log.error(`runtime poll failed: ${(error as Error).message}`);
    }
  }

  private queue(agentId: string): void {
    if (this.inFlight.has(agentId)) return;
    this.inFlight.add(agentId);
    void this.run(agentId).finally(() => this.inFlight.delete(agentId));
  }

  private async run(agentId: string): Promise<void> {
    try {
      await this.runner.runPending(agentId);
    } catch (error) {
      this.log.error(`agent ${agentId} background run failed: ${(error as Error).message}`);
    }
  }
}
