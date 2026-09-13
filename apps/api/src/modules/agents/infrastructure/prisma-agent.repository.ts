import { Injectable } from '@nestjs/common';
import type { AgentStatus, CreateAgent } from '@agentipo/shared';
import { asJson } from '../../../common/prisma/json';
import { PrismaService } from '../../../common/prisma/prisma.service';
import type {
  AgentRecord,
  AgentRepository,
  IdentityRef,
  WalletProvision,
} from '../domain/agent.repository';
import { toAgentRecord } from './mappers';

@Injectable()
export class PrismaAgentRepository implements AgentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateAgent): Promise<AgentRecord> {
    const row = await this.prisma.agent.create({
      data: {
        name: input.name,
        ownerAddress: input.ownerAddress,
        walletKind: input.walletKind,
        mode: input.mode,
        ownerAccountId: input.ownerAccountId,
        mandate: asJson(input.mandate),
      },
    });
    return toAgentRecord(row);
  }

  async findById(id: string): Promise<AgentRecord | null> {
    const row = await this.prisma.agent.findUnique({ where: { id } });
    return row ? toAgentRecord(row) : null;
  }

  async findAll(): Promise<AgentRecord[]> {
    const rows = await this.prisma.agent.findMany({ orderBy: { createdAt: 'desc' } });
    return rows.map(toAgentRecord);
  }

  async setWallet(id: string, wallet: WalletProvision): Promise<AgentRecord> {
    const row = await this.prisma.agent.update({
      where: { id },
      data: { walletAddress: wallet.walletAddress, circleWalletId: wallet.circleWalletId ?? null },
    });
    return toAgentRecord(row);
  }

  async setHederaAccount(id: string, accountId: string): Promise<AgentRecord> {
    return toAgentRecord(
      await this.prisma.agent.update({ where: { id }, data: { hederaAccountId: accountId } }),
    );
  }

  async setIdentity(id: string, identity: IdentityRef): Promise<AgentRecord> {
    const row = await this.prisma.agent.update({
      where: { id },
      data: {
        erc8004AgentId: identity.agentId,
        erc8004ChainId: identity.chainId,
        erc8004TxHash: identity.txHash,
      },
    });
    return toAgentRecord(row);
  }

  async setStatus(id: string, status: AgentStatus): Promise<AgentRecord> {
    return toAgentRecord(await this.prisma.agent.update({ where: { id }, data: { status } }));
  }
}
