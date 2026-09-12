import { Injectable } from '@nestjs/common';
import type { AccessRequest, AccessStatus, Mandate } from '@agentipo/shared';
import { PrismaService } from '../../../common/prisma/prisma.service';
import type { AccessRequestRepository } from '../domain/founder-metric.repository';

// The founder's decision needs a face: who owns this agent and what is it mandated to
// do. Joining the agent and startup here keeps that out of every call site.
const include = { agent: true, startup: true };
type Row = Awaited<ReturnType<PrismaService['dataAccessRequest']['findFirst']>>;
type Joined = NonNullable<Row> & {
  agent: { name: string; ownerAddress: string; mandate: unknown };
  startup: { name: string };
};

const toRequest = (r: Joined): AccessRequest => ({
  id: r.id,
  startupId: r.startupId,
  startupName: r.startup?.name ?? null,
  agentId: r.agentId,
  agentName: r.agent?.name ?? null,
  ownerAddress: r.agent?.ownerAddress ?? null,
  thesis: (r.agent?.mandate as Mandate | undefined)?.thesis ?? null,
  status: r.status,
  reason: r.reason,
  decidedAt: r.decidedAt?.toISOString() ?? null,
  createdAt: r.createdAt.toISOString(),
});

@Injectable()
export class PrismaAccessRequestRepository implements AccessRequestRepository {
  constructor(private readonly prisma: PrismaService) {}

  async request(startupId: string, agentId: string, reason: string): Promise<AccessRequest> {
    const row = await this.prisma.dataAccessRequest.upsert({
      where: { startupId_agentId: { startupId, agentId } },
      create: { startupId, agentId, reason },
      update: {}, // an agent asking again must not reset a decision already made
      include,
    });
    return toRequest(row as Joined);
  }

  async find(startupId: string, agentId: string): Promise<AccessRequest | null> {
    const row = await this.prisma.dataAccessRequest.findUnique({
      where: { startupId_agentId: { startupId, agentId } },
      include,
    });
    return row ? toRequest(row as Joined) : null;
  }

  async findById(id: string): Promise<AccessRequest | null> {
    const row = await this.prisma.dataAccessRequest.findUnique({ where: { id }, include });
    return row ? toRequest(row as Joined) : null;
  }

  async listByStartup(startupId: string): Promise<AccessRequest[]> {
    const rows = await this.prisma.dataAccessRequest.findMany({ where: { startupId }, include, orderBy: { createdAt: 'desc' } });
    return rows.map((r) => toRequest(r as Joined));
  }

  async listPending(): Promise<AccessRequest[]> {
    const rows = await this.prisma.dataAccessRequest.findMany({ where: { status: 'PENDING' }, include, orderBy: { createdAt: 'desc' } });
    return rows.map((r) => toRequest(r as Joined));
  }

  async decide(id: string, status: AccessStatus): Promise<AccessRequest> {
    const row = await this.prisma.dataAccessRequest.update({
      where: { id },
      data: { status, decidedAt: new Date() },
      include,
    });
    return toRequest(row as Joined);
  }
}
