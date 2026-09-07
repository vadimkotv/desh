import { Module } from '@nestjs/common';
import { SettlementModule } from '../settlement/settlement.module';
import { CreateRoundUseCase } from './application/create-round.usecase';
import { CreateStartupUseCase } from './application/create-startup.usecase';
import { RoundQueries } from './application/round-queries.usecase';
import { ROUND_REPOSITORY } from './domain/round.repository';
import { STARTUP_REPOSITORY } from './domain/startup.repository';
import { PrismaRoundRepository } from './infrastructure/prisma-round.repository';
import { PrismaStartupRepository } from './infrastructure/prisma-startup.repository';
import { RoundsController } from './presentation/rounds.controller';
import { StartupsController } from './presentation/startups.controller';

@Module({
  imports: [SettlementModule],
  controllers: [StartupsController, RoundsController],
  providers: [
    { provide: STARTUP_REPOSITORY, useClass: PrismaStartupRepository },
    { provide: ROUND_REPOSITORY, useClass: PrismaRoundRepository },
    CreateStartupUseCase,
    CreateRoundUseCase,
    RoundQueries,
  ],
  exports: [RoundQueries, ROUND_REPOSITORY, STARTUP_REPOSITORY],
})
export class StartupsModule {}
