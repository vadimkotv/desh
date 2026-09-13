import { Injectable } from '@nestjs/common';
import type { Account, AccountRole } from '@agentipo/shared';
import type { Account as DbAccount } from '../../../generated/prisma/client';
import { PrismaService } from '../../../common/prisma/prisma.service';
import type { AccountRepository } from '../domain/account.repository';
import type { VerifiedIdentity } from '../domain/identity-verifier.port';

const toAccount = (a: DbAccount): Account => ({
  id: a.id,
  privyDid: a.privyDid,
  role: a.role,
  walletAddress: a.walletAddress,
  email: a.email,
  verified: a.verified,
  createdAt: a.createdAt.toISOString(),
});

@Injectable()
export class PrismaAccountRepository implements AccountRepository {
  constructor(private readonly prisma: PrismaService) {}

  async upsert(identity: VerifiedIdentity): Promise<Account> {
    const { privyDid, walletAddress, email, verified } = identity;
    // Only overwrite wallet/email when the client actually supplied them; a later
    // sign-in without a linked wallet must not erase the one we already know.
    const touched = {
      ...(walletAddress ? { walletAddress } : {}),
      ...(email ? { email } : {}),
      verified,
    };
    const row = await this.prisma.account.upsert({
      where: { privyDid },
      create: { privyDid, walletAddress, email, verified },
      update: touched,
    });
    return toAccount(row);
  }

  async findById(id: string): Promise<Account | null> {
    const row = await this.prisma.account.findUnique({ where: { id } });
    return row ? toAccount(row) : null;
  }

  async setRole(id: string, role: AccountRole): Promise<Account> {
    return toAccount(await this.prisma.account.update({ where: { id }, data: { role } }));
  }

  async ownedIds(accountId: string): Promise<{ startupIds: string[]; agentIds: string[] }> {
    const [startups, agents] = await Promise.all([
      this.prisma.startup.findMany({ where: { ownerAccountId: accountId }, select: { id: true } }),
      this.prisma.agent.findMany({ where: { ownerAccountId: accountId }, select: { id: true } }),
    ]);
    return { startupIds: startups.map((s) => s.id), agentIds: agents.map((a) => a.id) };
  }
}
