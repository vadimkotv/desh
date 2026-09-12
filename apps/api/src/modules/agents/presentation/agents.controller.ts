import { Body, Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { type CreateAgent, CreateAgentSchema } from '@agentipo/shared';
import { ZodValidationPipe } from '../../../common/http/zod-validation.pipe';
import { AgentQueries, toPublicAgent } from '../application/agent-queries.usecase';
import { AgentRuntimeService } from '../application/agent-runtime.service';
import { CreateAgentUseCase } from '../application/create-agent.usecase';
import { RegisterIdentityUseCase } from '../application/register-identity.usecase';
import { ReviewFeedQuery } from '../application/review-feed.query';

@ApiTags('agents')
@Controller('agents')
export class AgentsController {
  constructor(
    private readonly createAgent: CreateAgentUseCase,
    private readonly registerIdentity: RegisterIdentityUseCase,
    private readonly runtime: AgentRuntimeService,
    private readonly queries: AgentQueries,
    private readonly feed: ReviewFeedQuery,
  ) {}

  @Post()
  async create(@Body(new ZodValidationPipe(CreateAgentSchema)) body: CreateAgent) {
    return toPublicAgent(await this.createAgent.execute(body));
  }

  @Get()
  list() {
    return this.queries.list();
  }

  @Get('feed')
  @ApiOperation({ summary: 'Rounds the running agents are watching, with their review state' })
  reviewFeed() {
    return this.feed.execute();
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
  run(@Param('id', ParseUUIDPipe) id: string) {
    return this.runtime.start(id);
  }

  @Post(':id/pause')
  pause(@Param('id', ParseUUIDPipe) id: string) {
    return this.runtime.pause(id);
  }

  @Get(':id/decisions')
  decisions(@Param('id', ParseUUIDPipe) id: string) {
    return this.queries.decisionsOf(id);
  }
}
