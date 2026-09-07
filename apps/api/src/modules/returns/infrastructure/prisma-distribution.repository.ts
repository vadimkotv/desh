import { Injectable } from '@nestjs/common';
import type { Distribution } from '@agentipo/shared';
import type { Distribution as DbDistribution } from '../../../generated/prisma/client';
import { decimalToNumber } from '../../../common/money';
import { PrismaService } from '../../../common/prisma/prisma.service';
import type { DistributionRepository, NewDistribution } from '../domain/distribution.repository';

const toDistribution = (d: DbDistribution): Distribution => ({
  id: d.id,
  roundId: d.roundId,
  amountUsdc: decimalToNumber(d.amountUsdc),
  txHash: d.txHash,
  source: d.source,
  createdAt: d.createdAt.toISOString(),
});

@Injectable()
export class PrismaDistributionRepository implements DistributionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: NewDistribution): Promise<Distribution> {
    return toDistribution(await this.prisma.distribution.create({ data: input }));
  }

  async listByRound(roundId: string): Promise<Distribution[]> {
    const rows = await this.prisma.distribution.findMany({ where: { roundId }, orderBy: { createdAt: 'desc' } });
    return rows.map(toDistribution);
  }
}
