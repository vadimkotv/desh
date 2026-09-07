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

  async setSubmitted(id: string, txHash: string, chainId: number): Promise<void> {
    await this.prisma.investment.update({ where: { id }, data: { txHash, chainId } });
  }

  async setStatus(id: string, status: InvestmentStatus, error?: string): Promise<void> {
    await this.prisma.investment.update({ where: { id }, data: { status, error } });
  }

  async addClaimed(agentId: string, roundId: string, amountUsdc: number): Promise<void> {
    // Attribute the claim to the agent's first confirmed ticket in this round.
    const first = await this.prisma.investment.findFirst({ where: { agentId, roundId, status: 'CONFIRMED' }, orderBy: { createdAt: 'asc' } });
    if (first) await this.prisma.investment.update({ where: { id: first.id }, data: { claimedUsdc: { increment: amountUsdc } } });
  }

  async confirmedByRound(roundId: string): Promise<Investment[]> {
    const rows = await this.prisma.investment.findMany({ where: { roundId, status: 'CONFIRMED' }, orderBy: { createdAt: 'asc' } });
    return rows.map(toInvestment);
  }

  async spentSince(agentId: string, since: Date): Promise<number> {
    const agg = await this.prisma.investment.aggregate({
      _sum: { amountUsdc: true },
      where: { agentId, createdAt: { gte: since }, status: { not: 'FAILED' } },
    });
    return agg._sum.amountUsdc ? decimalToNumber(agg._sum.amountUsdc) : 0;
  }
}
