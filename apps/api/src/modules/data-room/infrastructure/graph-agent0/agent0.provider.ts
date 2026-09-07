import { Injectable } from '@nestjs/common';
import { type Signal, SignalKeys } from '@agentipo/shared';
import { type DataProvider, signal, type StartupContext } from '../../domain/data-provider.port';
import { Agent0Client } from './agent0.client';

// Founder trust signal: does the founder address operate ERC-8004 registered agents,
// and what do their counterparties say about them?
@Injectable()
export class Agent0Provider implements DataProvider {
  readonly source = 'graph-agent0' as const;

  constructor(private readonly agent0: Agent0Client) {}

  supports(): boolean {
    return this.agent0.enabled;
  }

  async collect({ startup }: StartupContext): Promise<Signal[]> {
    const agents = await this.agent0.agentsOwnedBy(startup.founderAddress);
    const feedbackCount = agents.reduce((s, a) => s + a.totalFeedback, 0);
    const scored = agents.filter((a) => a.averageScore !== null);
    const avg = scored.length ? scored.reduce((s, a) => s + (a.averageScore ?? 0), 0) / scored.length : 0;
    const meta = { agents: agents.map((a) => ({ id: a.agentId, name: a.name })) };
    return [
      signal(this.source, SignalKeys.founderAgentFeedbackCount, feedbackCount, 'count', meta),
      signal(this.source, SignalKeys.founderAgentReputation, avg, 'score', meta),
    ];
  }
}
