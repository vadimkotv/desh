import type { Agent } from '@agentipo/shared';

export const AGENT_RUNTIME_EVENT = 'agentipo:agent-runtime';

export function announceAgentRuntime(agent: Agent): void {
  window.dispatchEvent(new CustomEvent<Agent>(AGENT_RUNTIME_EVENT, { detail: agent }));
}
