import { Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { EnsureReportUseCase } from '../application/ensure-report.usecase';
import { GenerateReportUseCase } from '../application/generate-report.usecase';
import { ReportQueries } from '../application/report-queries.usecase';

@ApiTags('due-diligence')
@Controller('due-diligence')
export class DueDiligenceController {
  constructor(
    private readonly generate: GenerateReportUseCase,
    private readonly ensure: EnsureReportUseCase,
    private readonly queries: ReportQueries,
  ) {}

  @Post('rounds/:id/generate')
  generateReport(@Param('id', ParseUUIDPipe) id: string) {
    return this.generate.execute(id);
  }

  @Get('rounds/:id')
  @ApiOperation({ summary: 'Free preview: score + summary (404 until a report exists)' })
  preview(@Param('id', ParseUUIDPipe) id: string) {
    return this.queries.preview(id);
  }

  @Get('rounds/:id/history')
  history(@Param('id', ParseUUIDPipe) id: string) {
    return this.queries.history(id);
  }

  @Get('rounds/:id/premium')
  @ApiOperation({ summary: 'x402-gated: full findings and raw signals, generated on demand (paid per request on Hedera)' })
  premium(@Param('id', ParseUUIDPipe) id: string) {
    return this.ensure.execute(id);
  }
}
