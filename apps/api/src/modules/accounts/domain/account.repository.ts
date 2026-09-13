import type { Account, AccountRole } from '@agentipo/shared';
import type { VerifiedIdentity } from './identity-verifier.port';

export const ACCOUNT_REPOSITORY = Symbol('ACCOUNT_REPOSITORY');

export interface AccountRepository {
  // Idempotent on privyDid: signing in again updates the wallet/email and returns the
  // same account, so a role chosen earlier survives every later sign-in.
  upsert(identity: VerifiedIdentity): Promise<Account>;
  findById(id: string): Promise<Account | null>;
  setRole(id: string, role: AccountRole): Promise<Account>;
  ownedIds(accountId: string): Promise<{ startupIds: string[]; agentIds: string[] }>;
}
