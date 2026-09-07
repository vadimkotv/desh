import { Controller, Get, Param, ParseUUIDPipe, Post, Query, Sse, type MessageEvent } from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import type { RunEvent } from '@agentipo/shared';
import { map, type Observable } from 'rxjs';
import { RunAgentUseCase } from '../application/run-agent.usecase';
import { RunEventBus } from '../application/run-event.bus';
import { AgentQueries } from '../application/agent-queries.usecase';

const toMessage = (event: RunEvent): MessageEvent => ({ id: String(event.id), type: event.type, data: event });

// Async runs + Server-Sent Events, so the dashboard can animate every pipeline step.
@ApiTags('runs')
@Controller()
export class RunsController {
  constructor(
    private readonly runAgent: RunAgentUseCase,
    private readonly events: RunEventBus,
    private readonly agents: AgentQueries,
  ) {}

  // "Swarm": every agent evaluates the same round concurrently; mandates make them disagree.
  @Post('rounds/:roundId/swarm')
  async swarm(@Param('roundId', ParseUUIDPipe) roundId: string) {
    const agents = await this.agents.list();
    return { runs: agents.map((a) => ({ agentId: a.id, agentName: a.name, runId: this.runAgent.start(a.id, { roundId }) })) };
  }

  @Post('agents/:id/runs')
  @ApiQuery({ name: 'roundId', required: false })
  start(@Param('id', ParseUUIDPipe) id: string, @Query('roundId') roundId?: string) {
    return { runId: this.runAgent.start(id, { roundId }) };
  }

  // Recent runs (newest first) as arrays of events — lets the UI render history on load.
  @Get('runs')
  @ApiQuery({ name: 'limit', required: false })
  recent(@Query('limit') limit?: string) {
    return this.events.recent(limit ? Number(limit) : 10);
  }

  @Sse('runs/:runId/events')
  run(@Param('runId') runId: string): Observable<MessageEvent> {
    return this.events.run$(runId).pipe(map(toMessage));
  }

  @Sse('events')
  firehose(): Observable<MessageEvent> {
    return this.events.all$.pipe(map(toMessage));
  }
}
