import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { AppConfig } from '../../../config/app-config';
import { AUDIT_LOG, type AuditLog } from '../../audit/domain/audit.port';
import { AGENT_REPOSITORY, type AgentRecord, type AgentRepository } from '../domain/agent.repository';
import { AGENT_IDENTITY, type AgentIdentity } from '../domain/identity.port';
import { buildAgentCard } from '../infrastructure/erc8004/agent-card';

@Injectable()
export class RegisterIdentityUseCase {
  constructor(
    @Inject(AGENT_REPOSITORY) private readonly agents: AgentRepository,
    @Inject(AGENT_IDENTITY) private readonly identity: AgentIdentity,
    @Inject(AUDIT_LOG) private readonly audit: AuditLog,
    private readonly config: AppConfig,
  ) {}

  async execute(agentId: string): Promise<AgentRecord> {
    const agent = await this.agents.findById(agentId);
    if (!agent) throw new NotFoundException(`Agent ${agentId} not found`);
    if (agent.erc8004AgentId) return agent;

    const agentURI = `${this.config.env.API_PUBLIC_URL}/agents/${agent.id}/card`;
    const ref = await this.identity.register(agent, agentURI);
    const updated = await this.agents.setIdentity(agent.id, ref);
    await this.audit.record('AGENT_REGISTERED', { erc8004: ref, agentURI }, agent.id);
    return updated;
  }

  card(agent: AgentRecord) {
    return buildAgentCard(agent, this.config.env.API_PUBLIC_URL);
  }
}
