import { Body, Controller, Get, Inject, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { type SettleExit, SettleExitSchema } from '@agentipo/shared';
import { ZodValidationPipe } from '../../../common/http/zod-validation.pipe';
import { ClaimReturnsUseCase } from '../application/claim-returns.usecase';
import { RoundLifecycleUseCase } from '../application/round-lifecycle.usecase';
import { RoundReturnsQuery } from '../application/round-returns.query';
import { EXIT_EVENT_REPOSITORY, type ExitEventRepository } from '../domain/exit-event.repository';

@ApiTags('returns')
@Controller()
export class ReturnsController {
  constructor(
    private readonly lifecycle: RoundLifecycleUseCase,
    private readonly claims: ClaimReturnsUseCase,
    private readonly returns: RoundReturnsQuery,
    @Inject(EXIT_EVENT_REPOSITORY) private readonly exits: ExitEventRepository,
  ) {}

  @Post('rounds/:id/finalize')
  @ApiOperation({ summary: 'Settle the round: Funded when target met, Failed after the deadline' })
  finalize(@Param('id', ParseUUIDPipe) id: string) {
    return this.lifecycle.finalize(id);
  }

  @Post('rounds/:id/milestones/release')
  @ApiOperation({ summary: 'Platform releases the next milestone tranche to the founder' })
  release(@Param('id', ParseUUIDPipe) id: string) {
    return this.lifecycle.releaseMilestone(id);
  }

  @Post('rounds/:id/exit')
  @ApiOperation({ summary: 'Settle a liquidity event (acquisition / IPO / TGE / contract) into the round' })
  settleExit(@Param('id', ParseUUIDPipe) id: string, @Body(new ZodValidationPipe(SettleExitSchema)) body: SettleExit) {
    return this.lifecycle.settleExit(id, body);
  }

  @Post('rounds/:id/sync')
  sync(@Param('id', ParseUUIDPipe) id: string) {
    return this.lifecycle.sync(id);
  }

  @Get('rounds/:id/returns')
  getReturns(@Param('id', ParseUUIDPipe) id: string) {
    return this.returns.execute(id);
  }

  @Get('rounds/:id/exits')
  list(@Param('id', ParseUUIDPipe) id: string) {
    return this.exits.listByRound(id);
  }

  @Post('agents/:id/claim')
  @ApiQuery({ name: 'roundId', required: true })
  claim(@Param('id', ParseUUIDPipe) id: string, @Query('roundId', ParseUUIDPipe) roundId: string) {
    return this.claims.execute(id, roundId);
  }
}
