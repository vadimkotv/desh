import { Body, Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { type ApproveDecision, ApproveDecisionSchema } from '@agentipo/shared';
import { ZodValidationPipe } from '../../../common/http/zod-validation.pipe';
import { AgentQueries } from '../application/agent-queries.usecase';
import { ApproveDecisionUseCase } from '../application/approve-decision.usecase';

@ApiTags('decisions')
@Controller('decisions')
export class DecisionsController {
  constructor(
    private readonly queries: AgentQueries,
    private readonly approvals: ApproveDecisionUseCase,
  ) {}

  @Get()
  list() {
    return this.queries.allDecisions();
  }

  @Get('pending')
  @ApiOperation({ summary: 'Proposals from ADVISORY agents waiting on a human' })
  pending() {
    return this.approvals.listPending();
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve a proposal; re-checks the mandate, then settles on Arc' })
  approve(@Param('id', ParseUUIDPipe) id: string, @Body(new ZodValidationPipe(ApproveDecisionSchema)) body: ApproveDecision) {
    return this.approvals.approve(id, body.approvedBy);
  }

  @Post(':id/reject')
  reject(@Param('id', ParseUUIDPipe) id: string, @Body(new ZodValidationPipe(ApproveDecisionSchema)) body: ApproveDecision) {
    return this.approvals.reject(id, body.approvedBy);
  }
}
