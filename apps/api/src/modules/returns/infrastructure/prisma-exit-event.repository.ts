import { Injectable } from '@nestjs/common';
import type { ExitEvent } from '@agentipo/shared';
import type { ExitEvent as DbExitEvent } from '../../../generated/prisma/client';
import { decimalToNumber } from '../../../common/money';
import { PrismaService } from '../../../common/prisma/prisma.service';
import type { ExitEventRepository, NewExitEvent } from '../domain/exit-event.repository';

const toExitEvent = (e: DbExitEvent): ExitEvent => ({
  id: e.id,
  roundId: e.roundId,
  kind: e.kind,
  valuationUsdc: decimalToNumber(e.valuationUsdc),
  proceedsUsdc: decimalToNumber(e.proceedsUsdc),
  evidenceUri: e.evidenceUri,
  txHash: e.txHash,
  createdAt: e.createdAt.toISOString(),
});

@Injectable()
export class PrismaExitEventRepository implements ExitEventRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: NewExitEvent): Promise<ExitEvent> {
    return toExitEvent(await this.prisma.exitEvent.create({ data: input }));
  }

  async listByRound(roundId: string): Promise<ExitEvent[]> {
    const rows = await this.prisma.exitEvent.findMany({
      where: { roundId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(toExitEvent);
  }
}
