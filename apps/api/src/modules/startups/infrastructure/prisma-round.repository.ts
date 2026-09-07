import { Injectable } from '@nestjs/common';
import type { CreateRound, RoundStatus } from '@agentipo/shared';
import { asJson } from '../../../common/prisma/json';
import { PrismaService } from '../../../common/prisma/prisma.service';
import type { RoundDetail, RoundOnchainRef, RoundRepository } from '../domain/round.repository';
import { toRoundDetail } from './mappers';

const include = { startup: true, investments: { orderBy: { createdAt: 'desc' as const } } };

@Injectable()
export class PrismaRoundRepository implements RoundRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateRound, onchain?: RoundOnchainRef): Promise<RoundDetail> {
    const row = await this.prisma.round.create({
      data: {
        startupId: input.startupId,
        targetUsdc: input.targetUsdc,
        minTicketUsdc: input.minTicketUsdc,
        deadline: new Date(input.deadline),
        milestones: asJson(input.milestones),
        onchainRoundId: onchain?.onchainRoundId,
        escrowAddress: onchain?.escrowAddress,
      },
      include,
    });
    return toRoundDetail(row);
  }

  async findById(id: string): Promise<RoundDetail | null> {
    const row = await this.prisma.round.findUnique({ where: { id }, include });
    return row ? toRoundDetail(row) : null;
  }

  async findAll(status?: RoundStatus): Promise<RoundDetail[]> {
    const rows = await this.prisma.round.findMany({
      where: status ? { status } : undefined,
      include,
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(toRoundDetail);
  }

  async findOpenBySectors(sectors: string[]): Promise<RoundDetail[]> {
    const rows = await this.prisma.round.findMany({
      where: {
        status: 'OPEN',
        deadline: { gt: new Date() },
        startup: { sector: { in: sectors, mode: 'insensitive' } },
      },
      include,
    });
    return rows.map(toRoundDetail);
  }

  async addRaised(id: string, amountUsdc: number): Promise<void> {
    await this.prisma.round.update({ where: { id }, data: { raisedUsdc: { increment: amountUsdc } } });
  }

  async setStatus(id: string, status: RoundStatus): Promise<void> {
    await this.prisma.round.update({ where: { id }, data: { status } });
  }
}
