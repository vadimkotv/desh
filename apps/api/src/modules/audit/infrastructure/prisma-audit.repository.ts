import { Injectable } from '@nestjs/common';
import type { AuditEntry, AuditKind } from '@agentipo/shared';
import type { AuditEntry as DbAudit } from '../../../generated/prisma/client';
import { asJson } from '../../../common/prisma/json';
import { PrismaService } from '../../../common/prisma/prisma.service';
import type { AuditRepository, ConsensusReceipt } from '../domain/audit.port';

const toEntry = (r: DbAudit): AuditEntry => ({
  id: r.id,
  agentId: r.agentId,
  kind: r.kind as AuditKind,
  payload: r.payload as Record<string, unknown>,
  hcsTopicId: r.hcsTopicId,
  hcsSequenceNumber: r.hcsSequenceNumber,
  createdAt: r.createdAt.toISOString(),
});

@Injectable()
export class PrismaAuditRepository implements AuditRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(kind: AuditKind, payload: Record<string, unknown>, agentId?: string | null): Promise<AuditEntry> {
    return toEntry(await this.prisma.auditEntry.create({ data: { kind, payload: asJson(payload), agentId: agentId ?? null } }));
  }

  async attachConsensus(id: string, receipt: ConsensusReceipt): Promise<void> {
    await this.prisma.auditEntry.update({
      where: { id },
      data: { hcsTopicId: receipt.topicId, hcsSequenceNumber: receipt.sequenceNumber },
    });
  }

  async list(limit = 100, agentId?: string): Promise<AuditEntry[]> {
    const rows = await this.prisma.auditEntry.findMany({
      where: agentId ? { agentId } : undefined,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return rows.map(toEntry);
  }
}
