import { Controller, Get, Inject, Query } from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { AUDIT_REPOSITORY, type AuditRepository } from '../domain/audit.port';

@ApiTags('audit')
@Controller('audit')
export class AuditController {
  constructor(@Inject(AUDIT_REPOSITORY) private readonly repo: AuditRepository) {}

  @Get()
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'agentId', required: false })
  list(@Query('limit') limit?: string, @Query('agentId') agentId?: string) {
    return this.repo.list(limit ? Number(limit) : 100, agentId);
  }
}
