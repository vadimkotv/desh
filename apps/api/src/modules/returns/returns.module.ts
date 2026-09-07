import { Module } from '@nestjs/common';
import { AgentsModule } from '../agents/agents.module';
import { AuditModule } from '../audit/audit.module';
import { SettlementModule } from '../settlement/settlement.module';
import { StartupsModule } from '../startups/startups.module';
import { ClaimReturnsUseCase } from './application/claim-returns.usecase';
import { RoundLifecycleUseCase } from './application/round-lifecycle.usecase';
import { RoundReturnsQuery } from './application/round-returns.query';
import { DISTRIBUTION_REPOSITORY } from './domain/distribution.repository';
import { PrismaDistributionRepository } from './infrastructure/prisma-distribution.repository';
import { ReturnsController } from './presentation/returns.controller';

// Revenue-based financing: after a round is funded, revenue flows into the escrow and
// agents claim their pro-rata share up to the return cap.
@Module({
  imports: [StartupsModule, SettlementModule, AgentsModule, AuditModule],
  controllers: [ReturnsController],
  providers: [
    RoundLifecycleUseCase,
    ClaimReturnsUseCase,
    RoundReturnsQuery,
    { provide: DISTRIBUTION_REPOSITORY, useClass: PrismaDistributionRepository },
  ],
})
export class ReturnsModule {}
