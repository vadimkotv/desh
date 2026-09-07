import { Injectable } from '@nestjs/common';
import type { Signal, SignalSource } from '@agentipo/shared';
import { asJson } from '../../../common/prisma/json';
import { PrismaService } from '../../../common/prisma/prisma.service';
import type { SnapshotRecord, SnapshotRepository } from '../domain/snapshot.repository';

@Injectable()
export class PrismaSnapshotRepository implements SnapshotRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(startupId: string, record: Omit<SnapshotRecord, 'fetchedAt'>): Promise<void> {
    await this.prisma.dataRoomSnapshot.create({
      data: { startupId, source: record.source, signals: asJson(record.signals), error: record.error },
    });
  }

  async latestPerSource(startupId: string): Promise<SnapshotRecord[]> {
    const rows = await this.prisma.dataRoomSnapshot.findMany({
      where: { startupId },
      orderBy: { fetchedAt: 'desc' },
      distinct: ['source'],
    });
    return rows.map((r) => ({
      source: r.source as SignalSource,
      signals: r.signals as Signal[],
      error: r.error ?? undefined,
      fetchedAt: r.fetchedAt.toISOString(),
    }));
  }
}
