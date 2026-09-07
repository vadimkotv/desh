import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { type CreateAgent, CreateAgentSchema } from '@agentipo/shared';
import { ZodValidationPipe } from '../../../common/http/zod-validation.pipe';
import { AgentQueries, toPublicAgent } from '../application/agent-queries.usecase';
import { CreateAgentUseCase } from '../application/create-agent.usecase';
import { RegisterIdentityUseCase } from '../application/register-identity.usecase';
import { RunAgentUseCase } from '../application/run-agent.usecase';

@ApiTags('agents')
@Controller('agents')
export class AgentsController {
  constructor(
    private readonly createAgent: CreateAgentUseCase,
    private readonly registerIdentity: RegisterIdentityUseCase,
    private readonly runAgent: RunAgentUseCase,
    private readonly queries: AgentQueries,
  ) {}

  @Post()
  async create(@Body(new ZodValidationPipe(CreateAgentSchema)) body: CreateAgent) {
    return toPublicAgent(await this.createAgent.execute(body));
  }

  @Get()
  list() {
    return this.queries.list();
  }

  @Get(':id')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.queries.get(id);
  }

  @Get(':id/card')
  async card(@Param('id', ParseUUIDPipe) id: string) {
    return this.registerIdentity.card(await this.queries.getRecord(id));
  }

  @Post(':id/identity')
  async identity(@Param('id', ParseUUIDPipe) id: string) {
    return toPublicAgent(await this.registerIdentity.execute(id));
  }

  @Post(':id/run')
  @ApiQuery({ name: 'roundId', required: false })
  run(@Param('id', ParseUUIDPipe) id: string, @Query('roundId') roundId?: string) {
    return this.runAgent.run(id, { roundId });
  }

  @Get(':id/decisions')
  decisions(@Param('id', ParseUUIDPipe) id: string) {
    return this.queries.decisionsOf(id);
  }
}
