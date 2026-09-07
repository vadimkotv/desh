import { Body, Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { type CreateStartup, CreateStartupSchema } from '@agentipo/shared';
import { ZodValidationPipe } from '../../../common/http/zod-validation.pipe';
import { CreateStartupUseCase } from '../application/create-startup.usecase';
import { RoundQueries } from '../application/round-queries.usecase';

@ApiTags('startups')
@Controller('startups')
export class StartupsController {
  constructor(
    private readonly createStartup: CreateStartupUseCase,
    private readonly queries: RoundQueries,
  ) {}

  @Post()
  create(@Body(new ZodValidationPipe(CreateStartupSchema)) body: CreateStartup) {
    return this.createStartup.execute(body);
  }

  @Get()
  list() {
    return this.queries.listStartups();
  }

  @Get(':id')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.queries.getStartup(id);
  }
}
