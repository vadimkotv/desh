import { Module } from '@nestjs/common';
import { SessionUseCase } from './application/session.usecase';
import { ACCOUNT_REPOSITORY } from './domain/account.repository';
import { IDENTITY_VERIFIER } from './domain/identity-verifier.port';
import { PrismaAccountRepository } from './infrastructure/prisma-account.repository';
import { PrivyVerifier } from './infrastructure/privy.verifier';
import { AccountsController } from './presentation/accounts.controller';

// Who is using the platform. Identity is delegated to Privy when it is configured and
// falls back to a clearly-marked demo session when it is not, so onboarding runs with
// no third-party keys at all — the same rule every other integration here follows.
@Module({
  controllers: [AccountsController],
  providers: [
    SessionUseCase,
    { provide: ACCOUNT_REPOSITORY, useClass: PrismaAccountRepository },
    { provide: IDENTITY_VERIFIER, useClass: PrivyVerifier },
  ],
  exports: [SessionUseCase],
})
export class AccountsModule {}
