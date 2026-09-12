import { Injectable } from '@nestjs/common';
import type { FounderMetric, MetricPoint, MetricUnit, UpsertMetric } from '@agentipo/shared';
import type { FounderMetric as DbMetric } from '../../../generated/prisma/client';
import { asJson } from '../../../common/prisma/json';
import { PrismaService } from '../../../common/prisma/prisma.service';
import type { FounderMetricRepository } from '../domain/founder-metric.repository';

const toMetric = (m: DbMetric): FounderMetric => ({
  id: m.id,
  startupId: m.startupId,
  key: m.key,
  label: m.label,
  unit: m.unit as MetricUnit,
  visibility: m.visibility,
  points: m.points as MetricPoint[],
  updatedAt: m.updatedAt.toISOString(),
});

@Injectable()
export class PrismaFounderMetricRepository implements FounderMetricRepository {
  constructor(private readonly prisma: PrismaService) {}

  async upsert(startupId: string, input: UpsertMetric): Promise<FounderMetric> {
    const data = {
      label: input.label,
      unit: input.unit,
      visibility: input.visibility,
      points: asJson(input.points),
    };
    const row = await this.prisma.founderMetric.upsert({
      where: { startupId_key: { startupId, key: input.key } },
      create: { startupId, key: input.key, ...data },
      update: data,
    });
    return toMetric(row);
  }

  async listByStartup(startupId: string): Promise<FounderMetric[]> {
    const rows = await this.prisma.founderMetric.findMany({ where: { startupId }, orderBy: { key: 'asc' } });
    return rows.map(toMetric);
  }

  async remove(startupId: string, key: string): Promise<void> {
    await this.prisma.founderMetric.deleteMany({ where: { startupId, key } });
  }
}
