import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { AccountRole, Session, SessionRequest } from '@agentipo/shared';
import { ACCOUNT_REPOSITORY, type AccountRepository } from '../domain/account.repository';
import { IDENTITY_VERIFIER, type IdentityVerifier } from '../domain/identity-verifier.port';

// Sign-in and onboarding. Identity is whatever the verifier can prove; the role is the
// only thing the person chooses, and it decides which half of the product they land in.
@Injectable()
export class SessionUseCase {
  private readonly log = new Logger(SessionUseCase.name);

  constructor(
    @Inject(ACCOUNT_REPOSITORY) private readonly accounts: AccountRepository,
    @Inject(IDENTITY_VERIFIER) private readonly identity: IdentityVerifier,
  ) {}

  async open(request: SessionRequest): Promise<Session> {
    const verified = await this.identity.verify(request);
    const account = await this.accounts.upsert(verified);
    this.log.log(`session for ${account.privyDid}${verified.verified ? '' : ' (demo, unverified)'}`);
    return this.sessionOf(account.id);
  }

  async setRole(accountId: string, role: AccountRole): Promise<Session> {
    await this.get(accountId);
    await this.accounts.setRole(accountId, role);
    return this.sessionOf(accountId);
  }

  sessionOf(accountId: string): Promise<Session> {
    return this.build(accountId);
  }

  private async build(accountId: string): Promise<Session> {
    const account = await this.get(accountId);
    const owned = await this.accounts.ownedIds(accountId);
    return { account, ...owned };
  }

  private async get(accountId: string) {
    const account = await this.accounts.findById(accountId);
    if (!account) throw new NotFoundException(`Account ${accountId} not found`);
    return account;
  }
}
