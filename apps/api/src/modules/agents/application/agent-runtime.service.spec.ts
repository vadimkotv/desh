import { describe, expect, it, vi } from 'vitest';
import type { Agent } from '@agentipo/shared';
import type { AgentQueries } from './agent-queries.usecase';
import { AgentRuntimeService } from './agent-runtime.service';
import type { RunEventBus } from './run-event.bus';
import type { RunAgentUseCase } from './run-agent.usecase';

const agent = { id: 'agent-1', name: 'Sentinel', status: 'PAUSED' } as Agent;

function setup() {
  const agents = {
    setStatus: vi.fn(async (_id: string, status: Agent['status']) => ({ ...agent, status })),
    listRecords: vi.fn(async () => []),
  };
  const runner = { runPending: vi.fn(async () => false) };
  const events = { announce: vi.fn() };
  const service = new AgentRuntimeService(
    agents as unknown as AgentQueries,
    runner as unknown as RunAgentUseCase,
    events as unknown as RunEventBus,
  );
  return { agents, runner, events, service };
}

describe('AgentRuntimeService', () => {
  it('persists RUNNING and queues background research', async () => {
    const { agents, runner, events, service } = setup();
    const result = await service.start(agent.id);

    expect(result.status).toBe('RUNNING');
    expect(agents.setStatus).toHaveBeenCalledWith(agent.id, 'RUNNING');
    expect(events.announce).toHaveBeenCalledWith(agent.id, 'agent.started', expect.anything());
    await vi.waitFor(() => expect(runner.runPending).toHaveBeenCalledWith(agent.id));
  });

  it('persists PAUSED without starting work', async () => {
    const { agents, runner, events, service } = setup();
    const result = await service.pause(agent.id);

    expect(result.status).toBe('PAUSED');
    expect(agents.setStatus).toHaveBeenCalledWith(agent.id, 'PAUSED');
    expect(events.announce).toHaveBeenCalledWith(agent.id, 'agent.paused', expect.anything());
    expect(runner.runPending).not.toHaveBeenCalled();
  });
});
