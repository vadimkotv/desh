import { Module } from '@nestjs/common';
import { AgentsModule } from '../agents/agents.module';
import { AuditModule } from '../audit/audit.module';
import { SettlementModule } from '../settlement/settlement.module';
import { StartupsModule } from '../startups/startups.module';
import { ClaimReturnsUseCase } from './application/claim-returns.usecase';
import { RoundLifecycleUseCase } from './application/round-lifecycle.usecase';
import { RoundReturnsQuery } from './application/round-returns.query';
import { EXIT_EVENT_REPOSITORY } from './domain/exit-event.repository';
import { PrismaExitEventRepository } from './infrastructure/prisma-exit-event.repository';
import { ReturnsController } from './presentation/returns.controller';

// Exit-based returns: a funded round pays nothing until a liquidity event is settled
// into the escrow, after which agents claim their pro-rata share of the proceeds.
@Module({
  imports: [StartupsModule, SettlementModule, AgentsModule, AuditModule],
  controllers: [ReturnsController],
  providers: [
    RoundLifecycleUseCase,
    ClaimReturnsUseCase,
    RoundReturnsQuery,
    { provide: EXIT_EVENT_REPOSITORY, useClass: PrismaExitEventRepository },
  ],
})
export class ReturnsModule {}
