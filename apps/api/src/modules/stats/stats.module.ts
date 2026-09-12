import { Controller, Get, Injectable, Module } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Stats } from '@agentipo/shared';
import { decimalToNumber } from '../../common/money';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class StatsQuery {
  constructor(private readonly prisma: PrismaService) {}

  async execute(): Promise<Stats> {
    const p = this.prisma;
    const [rounds, openRounds, agents, decisions, investments, dataPurchases, auditEntries, hcsAnchored, accessGranted, accessPending] =
      await Promise.all([
        p.round.aggregate({ _count: true, _sum: { raisedUsdc: true, targetUsdc: true, proceedsUsdc: true } }),
        p.round.count({ where: { status: 'OPEN' } }),
        p.agent.count(),
        p.decision.count(),
        p.investment.aggregate({ _count: true, _sum: { amountUsdc: true, claimedUsdc: true }, where: { status: 'CONFIRMED' } }),
        p.paymentReceipt.count({ where: { success: true } }),
        p.auditEntry.count(),
        p.auditEntry.count({ where: { hcsSequenceNumber: { not: null } } }),
        p.dataAccessRequest.count({ where: { status: 'GRANTED' } }),
        p.dataAccessRequest.count({ where: { status: 'PENDING' } }),
      ]);
    return {
      openRounds,
      totalRounds: rounds._count,
      raisedUsdc: decimalToNumber(rounds._sum.raisedUsdc ?? 0),
      targetUsdc: decimalToNumber(rounds._sum.targetUsdc ?? 0),
      agents,
      decisions,
      investments: investments._count,
      investedUsdc: decimalToNumber(investments._sum.amountUsdc ?? 0),
      dataPurchases,
      accessGranted,
      accessPending,
      proceedsUsdc: decimalToNumber(rounds._sum.proceedsUsdc ?? 0),
      claimedUsdc: decimalToNumber(investments._sum.claimedUsdc ?? 0),
      auditEntries,
      hcsAnchored,
    };
  }
}

@ApiTags('stats')
@Controller('stats')
class StatsController {
  constructor(private readonly stats: StatsQuery) {}

  @Get()
  get() {
    return this.stats.execute();
  }
}

@Module({ controllers: [StatsController], providers: [StatsQuery] })
export class StatsModule {}
