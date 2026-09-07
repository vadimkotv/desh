import { Body, Controller, Get, Inject, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { type Distribute, DistributeSchema } from '@agentipo/shared';
import { ZodValidationPipe } from '../../../common/http/zod-validation.pipe';
import { ClaimReturnsUseCase } from '../application/claim-returns.usecase';
import { RoundLifecycleUseCase } from '../application/round-lifecycle.usecase';
import { RoundReturnsQuery } from '../application/round-returns.query';
import { DISTRIBUTION_REPOSITORY, type DistributionRepository } from '../domain/distribution.repository';

@ApiTags('returns')
@Controller()
export class ReturnsController {
  constructor(
    private readonly lifecycle: RoundLifecycleUseCase,
    private readonly claims: ClaimReturnsUseCase,
    private readonly returns: RoundReturnsQuery,
    @Inject(DISTRIBUTION_REPOSITORY) private readonly distributions: DistributionRepository,
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

  @Post('rounds/:id/distribute')
  @ApiOperation({ summary: 'Route revenue into the round; investors claim pro-rata up to the cap' })
  distribute(@Param('id', ParseUUIDPipe) id: string, @Body(new ZodValidationPipe(DistributeSchema)) body: Distribute) {
    return this.lifecycle.distribute(id, body.amountUsdc);
  }

  @Post('rounds/:id/sync')
  sync(@Param('id', ParseUUIDPipe) id: string) {
    return this.lifecycle.sync(id);
  }

  @Get('rounds/:id/returns')
  getReturns(@Param('id', ParseUUIDPipe) id: string) {
    return this.returns.execute(id);
  }

  @Get('rounds/:id/distributions')
  list(@Param('id', ParseUUIDPipe) id: string) {
    return this.distributions.listByRound(id);
  }

  @Post('agents/:id/claim')
  @ApiQuery({ name: 'roundId', required: true })
  claim(@Param('id', ParseUUIDPipe) id: string, @Query('roundId', ParseUUIDPipe) roundId: string) {
    return this.claims.execute(id, roundId);
  }
}
