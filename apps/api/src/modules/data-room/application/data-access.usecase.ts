import { BadRequestException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { AccessRequest } from '@agentipo/shared';
import { AUDIT_LOG, type AuditLog } from '../../audit/domain/audit.port';
import { ACCESS_REQUEST_REPOSITORY, type AccessRequestRepository } from '../domain/founder-metric.repository';

// The founder's side of the gated data room. Instead of the platform charging agents
// for a report, the founder decides — seeing whose agent is asking and on what mandate.
@Injectable()
export class DataAccessUseCase {
  private readonly log = new Logger(DataAccessUseCase.name);

  constructor(
    @Inject(ACCESS_REQUEST_REPOSITORY) private readonly requests: AccessRequestRepository,
    @Inject(AUDIT_LOG) private readonly audit: AuditLog,
  ) {}

  async request(startupId: string, agentId: string, reason: string): Promise<AccessRequest> {
    const existing = await this.requests.find(startupId, agentId);
    const request = await this.requests.request(startupId, agentId, reason);
    // Only the first ask is news; re-running an agent must not spam the founder.
    if (!existing) {
      await this.audit.record('ACCESS_REQUESTED', { startupId, requestId: request.id, reason }, agentId);
      this.log.log(`${request.agentName} asked ${request.startupName} for gated data`);
    }
    return request;
  }

  listPending(): Promise<AccessRequest[]> {
    return this.requests.listPending();
  }

  listByStartup(startupId: string): Promise<AccessRequest[]> {
    return this.requests.listByStartup(startupId);
  }

  grant(id: string): Promise<AccessRequest> {
    return this.decide(id, 'GRANTED');
  }

  deny(id: string): Promise<AccessRequest> {
    return this.decide(id, 'DENIED');
  }

  private async decide(id: string, status: 'GRANTED' | 'DENIED'): Promise<AccessRequest> {
    const current = await this.requests.findById(id);
    if (!current) throw new NotFoundException(`Access request ${id} not found`);
    if (current.status === status) throw new BadRequestException(`already ${status.toLowerCase()}`);

    const request = await this.requests.decide(id, status);
    await this.audit.record(
      status === 'GRANTED' ? 'ACCESS_GRANTED' : 'ACCESS_DENIED',
      { startupId: request.startupId, requestId: id, startup: request.startupName },
      request.agentId,
    );
    this.log.log(`${request.startupName} ${status.toLowerCase()} data access to ${request.agentName}`);
    return request;
  }
}
