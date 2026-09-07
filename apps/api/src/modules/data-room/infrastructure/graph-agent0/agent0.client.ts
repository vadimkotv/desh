import { Injectable } from '@nestjs/common';
import { AppConfig } from '../../../../config/app-config';
import { GraphGatewayClient } from '../../../../common/graph/graph-gateway.client';

export interface Agent0Reputation {
  agentId: string;
  totalFeedback: number;
  averageScore: number | null;
  name?: string;
}

const AGENTS_BY_OWNER = `
  query AgentsByOwner($owner: Bytes!) {
    agents(first: 20, where: { owner: $owner }) {
      agentId totalFeedback registrationFile { name }
      feedback(first: 100, where: { isRevoked: false }) { value }
    }
  }`;

const AGENT_BY_ID = `
  query AgentById($id: ID!) {
    agent(id: $id) { agentId totalFeedback registrationFile { name } feedback(first: 100) { value } }
  }`;

interface RawAgent { agentId: string; totalFeedback: string; registrationFile: { name: string } | null; feedback: { value: string }[] }

// Graph product #3: Agent0 / ERC-8004 subgraphs — the on-chain trust layer for agents.
@Injectable()
export class Agent0Client {
  constructor(
    private readonly gateway: GraphGatewayClient,
    private readonly config: AppConfig,
  ) {}

  get enabled(): boolean {
    return this.gateway.enabled;
  }

  async agentsOwnedBy(owner: string): Promise<Agent0Reputation[]> {
    const data = await this.gateway.query<{ agents: RawAgent[] }>(this.subgraphId, AGENTS_BY_OWNER, {
      owner: owner.toLowerCase(),
    });
    return data.agents.map(toReputation);
  }

  async reputationOf(chainId: number, agentId: string): Promise<Agent0Reputation | null> {
    const data = await this.gateway.query<{ agent: RawAgent | null }>(this.subgraphId, AGENT_BY_ID, {
      id: `${chainId}:${agentId}`,
    });
    return data.agent ? toReputation(data.agent) : null;
  }

  private get subgraphId(): string {
    return this.config.env.GRAPH_AGENT0_SUBGRAPH_ID;
  }
}

function toReputation(a: RawAgent): Agent0Reputation {
  const values = a.feedback.map((f) => Number(f.value));
  const averageScore = values.length ? values.reduce((s, v) => s + v, 0) / values.length : null;
  return { agentId: a.agentId, totalFeedback: Number(a.totalFeedback), averageScore, name: a.registrationFile?.name };
}
