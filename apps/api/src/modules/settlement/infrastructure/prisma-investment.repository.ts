import { Injectable } from '@nestjs/common';
import type { Investment, InvestmentStatus } from '@agentipo/shared';
import { decimalToNumber } from '../../../common/money';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { toInvestment } from '../../startups/infrastructure/mappers';
import type { InvestmentRepository, NewInvestment } from '../domain/investment.repository';

@Injectable()
export class PrismaInvestmentRepository implements InvestmentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: NewInvestment): Promise<Investment> {
    return toInvestment(await this.prisma.investment.create({ data: input }));
  }

  async setSubmitted(id: string, txHash: string): Promise<void> {
    await this.prisma.investment.update({ where: { id }, data: { txHash } });
  }

  async setStatus(id: string, status: InvestmentStatus, error?: string): Promise<void> {
    await this.prisma.investment.update({ where: { id }, data: { status, error } });
  }

  async spentSince(agentId: string, since: Date): Promise<number> {
    const agg = await this.prisma.investment.aggregate({
      _sum: { amountUsdc: true },
      where: { agentId, createdAt: { gte: since }, status: { not: 'FAILED' } },
    });
    return agg._sum.amountUsdc ? decimalToNumber(agg._sum.amountUsdc) : 0;
  }
}
