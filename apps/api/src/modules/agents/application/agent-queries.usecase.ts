import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Agent, AgentStatus, Decision } from '@agentipo/shared';
import {
  AGENT_REPOSITORY,
  type AgentRecord,
  type AgentRepository,
} from '../domain/agent.repository';
import { DECISION_REPOSITORY, type DecisionRepository } from '../domain/decision.repository';

// Strips private wiring (keyIndex, circleWalletId) before anything leaves the API.
export const toPublicAgent = ({ keyIndex: _k, circleWalletId: _c, ...agent }: AgentRecord): Agent =>
  agent;

@Injectable()
export class AgentQueries {
  constructor(
    @Inject(AGENT_REPOSITORY) private readonly agents: AgentRepository,
    @Inject(DECISION_REPOSITORY) private readonly decisions: DecisionRepository,
  ) {}

  async list(): Promise<Agent[]> {
    return (await this.agents.findAll()).map(toPublicAgent);
  }

  listRecords(): Promise<AgentRecord[]> {
    return this.agents.findAll();
  }

  async getRecord(id: string): Promise<AgentRecord> {
    const agent = await this.agents.findById(id);
    if (!agent) throw new NotFoundException(`Agent ${id} not found`);
    return agent;
  }

  async get(id: string): Promise<Agent> {
    return toPublicAgent(await this.getRecord(id));
  }

  async setStatus(id: string, status: AgentStatus): Promise<Agent> {
    await this.getRecord(id);
    return toPublicAgent(await this.agents.setStatus(id, status));
  }

  decisionsOf(agentId: string): Promise<Decision[]> {
    return this.decisions.listByAgent(agentId);
  }

  allDecisions(): Promise<Decision[]> {
    return this.decisions.listAll();
  }
}
