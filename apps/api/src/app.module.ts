import { Module } from '@nestjs/common';
import { GraphModule } from './common/graph/graph.module';
import { HederaModule } from './common/hedera/hedera.module';
import { PrismaModule } from './common/prisma/prisma.module';
import { ConfigModule } from './config/config.module';
import { AgentsModule } from './modules/agents/agents.module';
import { AuditModule } from './modules/audit/audit.module';
import { DataRoomModule } from './modules/data-room/data-room.module';
import { DueDiligenceModule } from './modules/due-diligence/due-diligence.module';
import { HealthModule } from './modules/health/health.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { SettlementModule } from './modules/settlement/settlement.module';
import { StartupsModule } from './modules/startups/startups.module';
import { StatsModule } from './modules/stats/stats.module';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    GraphModule,
    HederaModule,
    HealthModule,
    StartupsModule,
    DataRoomModule,
    DueDiligenceModule,
    PaymentsModule,
    SettlementModule,
    AuditModule,
    AgentsModule,
    StatsModule,
  ],
})
export class AppModule {}
