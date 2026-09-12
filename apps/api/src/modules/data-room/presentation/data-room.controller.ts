import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { type RequestAccess, RequestAccessSchema, type UpsertMetric, UpsertMetricSchema } from '@agentipo/shared';
import { ZodValidationPipe } from '../../../common/http/zod-validation.pipe';
import { CollectDataRoomUseCase } from '../application/collect-data-room.usecase';
import { DataAccessUseCase } from '../application/data-access.usecase';
import { DiscloseMetricsQuery } from '../application/disclose-metrics.query';
import { LatestSignalsQuery } from '../application/latest-signals.query';
import { FOUNDER_METRIC_REPOSITORY } from '../domain/founder-metric.repository';
import type { FounderMetricRepository } from '../domain/founder-metric.repository';
import { Inject } from '@nestjs/common';

@ApiTags('data-room')
@Controller('data-room')
export class DataRoomController {
  constructor(
    private readonly collect: CollectDataRoomUseCase,
    private readonly latest: LatestSignalsQuery,
    private readonly disclose: DiscloseMetricsQuery,
    private readonly access: DataAccessUseCase,
    @Inject(FOUNDER_METRIC_REPOSITORY) private readonly metrics: FounderMetricRepository,
  ) {}

  @Post('startups/:id/refresh')
  refresh(@Param('id', ParseUUIDPipe) id: string) {
    return this.collect.execute(id);
  }

  @Get('startups/:id/signals')
  signals(@Param('id', ParseUUIDPipe) id: string) {
    return this.latest.execute(id);
  }

  // ── founder-published metrics ──────────────────────────────────────────

  @Post('startups/:id/metrics')
  @ApiOperation({ summary: 'Publish a metric as a time series; GATED ones need the founder to open them' })
  upsertMetric(@Param('id', ParseUUIDPipe) id: string, @Body(new ZodValidationPipe(UpsertMetricSchema)) body: UpsertMetric) {
    return this.metrics.upsert(id, body);
  }

  @Delete('startups/:id/metrics/:key')
  removeMetric(@Param('id', ParseUUIDPipe) id: string, @Param('key') key: string) {
    return this.metrics.remove(id, key);
  }

  @Get('startups/:id/metrics')
  @ApiQuery({ name: 'agentId', required: false })
  @ApiOperation({ summary: 'Metrics as one viewer may see them; gated ones come back withheld' })
  metricsFor(@Param('id', ParseUUIDPipe) id: string, @Query('agentId') agentId?: string) {
    return this.disclose.execute(id, agentId);
  }

  // ── access the founder grants ──────────────────────────────────────────

  @Post('startups/:id/access')
  @ApiOperation({ summary: 'An agent asks the founder to open the gated data room' })
  requestAccess(@Param('id', ParseUUIDPipe) id: string, @Body(new ZodValidationPipe(RequestAccessSchema)) body: RequestAccess) {
    return this.access.request(id, body.agentId, body.reason);
  }

  @Get('startups/:id/access')
  listAccess(@Param('id', ParseUUIDPipe) id: string) {
    return this.access.listByStartup(id);
  }

  @Get('access/pending')
  pending() {
    return this.access.listPending();
  }

  @Post('access/:id/grant')
  grant(@Param('id', ParseUUIDPipe) id: string) {
    return this.access.grant(id);
  }

  @Post('access/:id/deny')
  deny(@Param('id', ParseUUIDPipe) id: string) {
    return this.access.deny(id);
  }
}
