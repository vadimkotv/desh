import { Inject, Injectable, Logger } from '@nestjs/common';
import type { AuditEntry, AuditKind } from '@agentipo/shared';
import {
  AUDIT_REPOSITORY,
  type AuditLog,
  type AuditRepository,
  CONSENSUS_PUBLISHER,
  type ConsensusPublisher,
} from '../domain/audit.port';

// DB first (never lose an entry), then mirror to HCS best-effort and attach the
// consensus sequence number so anyone can verify the entry on HashScan.
@Injectable()
export class RecordAuditUseCase implements AuditLog {
  private readonly log = new Logger(RecordAuditUseCase.name);

  constructor(
    @Inject(AUDIT_REPOSITORY) private readonly repo: AuditRepository,
    @Inject(CONSENSUS_PUBLISHER) private readonly consensus: ConsensusPublisher | null,
  ) {}

  async record(kind: AuditKind, payload: Record<string, unknown>, agentId?: string | null): Promise<AuditEntry> {
    const entry = await this.repo.create(kind, payload, agentId);
    if (!this.consensus) return entry;
    try {
      const message = JSON.stringify({ id: entry.id, kind, agentId: agentId ?? null, at: entry.createdAt, payload });
      const receipt = await this.consensus.publish(message);
      await this.repo.attachConsensus(entry.id, receipt);
      return { ...entry, hcsTopicId: receipt.topicId, hcsSequenceNumber: receipt.sequenceNumber };
    } catch (err) {
      this.log.warn(`HCS publish failed for ${entry.id}: ${(err as Error).message}`);
      return entry;
    }
  }
}
