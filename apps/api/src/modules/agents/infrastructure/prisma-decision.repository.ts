import { Injectable } from '@nestjs/common';
import type { Decision } from '@agentipo/shared';
import { asJson } from '../../../common/prisma/json';
import { PrismaService } from '../../../common/prisma/prisma.service';
import type { DecisionRepository, NewDecision } from '../domain/decision.repository';
import { toDecision } from './mappers';

const include = { investment: true };

@Injectable()
export class PrismaDecisionRepository implements DecisionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: NewDecision): Promise<Decision> {
    const row = await this.prisma.decision.create({
      data: {
        agentId: input.agentId,
        roundId: input.roundId,
        reportId: input.reportId,
        action: input.action,
        amountUsdc: input.amountUsdc,
        confidence: input.confidence,
        reasoning: input.reasoning,
        keyRisks: asJson(input.keyRisks),
        engine: input.engine,
        dataPaymentTxId: input.dataPaymentTxId,
      },
      include,
    });
    return toDecision(row);
  }

  async findById(id: string): Promise<Decision | null> {
    const row = await this.prisma.decision.findUnique({ where: { id }, include });
    return row ? toDecision(row) : null;
  }

  async listByAgent(agentId: string, limit = 100): Promise<Decision[]> {
    const rows = await this.prisma.decision.findMany({ where: { agentId }, include, orderBy: { createdAt: 'desc' }, take: limit });
    return rows.map(toDecision);
  }

  async listAll(limit = 100): Promise<Decision[]> {
    const rows = await this.prisma.decision.findMany({ include, orderBy: { createdAt: 'desc' }, take: limit });
    return rows.map(toDecision);
  }
}
