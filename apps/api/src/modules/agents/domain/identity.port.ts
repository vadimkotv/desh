import type { AgentRecord, IdentityRef } from './agent.repository';

export const AGENT_IDENTITY = Symbol('AGENT_IDENTITY');

// ERC-8004 identity registration (Identity Registry on Sepolia / Base Sepolia).
export interface AgentIdentity {
  register(agent: AgentRecord, agentURI: string): Promise<IdentityRef>;
}
