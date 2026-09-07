import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AgentQueries } from '../application/agent-queries.usecase';

@ApiTags('decisions')
@Controller('decisions')
export class DecisionsController {
  constructor(private readonly queries: AgentQueries) {}

  @Get()
  list() {
    return this.queries.allDecisions();
  }
}
