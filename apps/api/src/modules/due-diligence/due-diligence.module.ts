import { type MiddlewareConsumer, Module, type NestModule, RequestMethod } from '@nestjs/common';
import { DataRoomModule } from '../data-room/data-room.module';
import { X402Middleware } from '../payments/infrastructure/x402/x402.middleware';
import { PaymentsModule } from '../payments/payments.module';
import { SettlementModule } from '../settlement/settlement.module';
import { StartupsModule } from '../startups/startups.module';
import { EnsureReportUseCase } from './application/ensure-report.usecase';
import { GenerateReportUseCase } from './application/generate-report.usecase';
import { ReportQueries } from './application/report-queries.usecase';
import { SIGNAL_EVALUATORS } from './domain/evaluator.port';
import { ActivityEvaluator } from './domain/evaluators/activity.evaluator';
import { DistributionEvaluator } from './domain/evaluators/distribution.evaluator';
import { GrowthEvaluator } from './domain/evaluators/growth.evaluator';
import { LiquidityEvaluator } from './domain/evaluators/liquidity.evaluator';
import { ReputationEvaluator } from './domain/evaluators/reputation.evaluator';
import { TractionEvaluator } from './domain/evaluators/traction.evaluator';
import { TreasuryEvaluator } from './domain/evaluators/treasury.evaluator';
import { REPORT_REPOSITORY } from './domain/report.repository';
import { PrismaReportRepository } from './infrastructure/prisma-report.repository';
import { DueDiligenceController } from './presentation/due-diligence.controller';

export const PREMIUM_REPORT_ROUTE = 'due-diligence/rounds/:id/premium';

@Module({
  imports: [StartupsModule, DataRoomModule, SettlementModule, PaymentsModule],
  controllers: [DueDiligenceController],
  providers: [
    GenerateReportUseCase,
    EnsureReportUseCase,
    ReportQueries,
    { provide: REPORT_REPOSITORY, useClass: PrismaReportRepository },
    {
      provide: SIGNAL_EVALUATORS,
      useFactory: () => [
        new DistributionEvaluator(),
        new ActivityEvaluator(),
        new TreasuryEvaluator(),
        new LiquidityEvaluator(),
        new ReputationEvaluator(),
        new TractionEvaluator(),
        new GrowthEvaluator(),
      ],
    },
  ],
  exports: [ReportQueries, GenerateReportUseCase, EnsureReportUseCase],
})
export class DueDiligenceModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(X402Middleware).forRoutes({ path: PREMIUM_REPORT_ROUTE, method: RequestMethod.GET });
  }
}
