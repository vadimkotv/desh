import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { type CreateRound, CreateRoundSchema, RoundStatus } from '@agentipo/shared';
import { ZodValidationPipe } from '../../../common/http/zod-validation.pipe';
import { CreateRoundUseCase } from '../application/create-round.usecase';
import { RoundQueries } from '../application/round-queries.usecase';

@ApiTags('rounds')
@Controller('rounds')
export class RoundsController {
  constructor(
    private readonly createRound: CreateRoundUseCase,
    private readonly queries: RoundQueries,
  ) {}

  @Post()
  create(@Body(new ZodValidationPipe(CreateRoundSchema)) body: CreateRound) {
    return this.createRound.execute(body);
  }

  @Get()
  @ApiQuery({ name: 'status', required: false, enum: RoundStatus.options })
  list(@Query('status', new ZodValidationPipe(RoundStatus.optional())) status?: RoundStatus) {
    return this.queries.list(status);
  }

  @Get(':id')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.queries.getRound(id);
  }
}
