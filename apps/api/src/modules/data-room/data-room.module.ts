import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { StartupsModule } from '../startups/startups.module';
import { CollectDataRoomUseCase } from './application/collect-data-room.usecase';
import { DataAccessUseCase } from './application/data-access.usecase';
import { DiscloseMetricsQuery } from './application/disclose-metrics.query';
import { GrowthSignalsQuery } from './application/growth-signals.query';
import { LatestSignalsQuery } from './application/latest-signals.query';
import { DATA_PROVIDERS, type DataProvider } from './domain/data-provider.port';
import { ACCESS_REQUEST_REPOSITORY, FOUNDER_METRIC_REPOSITORY } from './domain/founder-metric.repository';
import { SNAPSHOT_REPOSITORY } from './domain/snapshot.repository';
import { DemoFixtureProvider } from './infrastructure/demo/demo-fixture.provider';
import { Agent0Client } from './infrastructure/graph-agent0/agent0.client';
import { Agent0Provider } from './infrastructure/graph-agent0/agent0.provider';
import { MessariDexProvider } from './infrastructure/graph-messari/messari-dex.provider';
import { TokenApiClient } from './infrastructure/graph-token-api/token-api.client';
import { TokenApiProvider } from './infrastructure/graph-token-api/token-api.provider';
import { PrismaAccessRequestRepository } from './infrastructure/prisma-access-request.repository';
import { PrismaFounderMetricRepository } from './infrastructure/prisma-founder-metric.repository';
import { PrismaSnapshotRepository } from './infrastructure/prisma-snapshot.repository';
import { DataRoomController } from './presentation/data-room.controller';

@Module({
  imports: [StartupsModule, AuditModule],
  controllers: [DataRoomController],
  providers: [
    TokenApiClient,
    Agent0Client,
    TokenApiProvider,
    MessariDexProvider,
    Agent0Provider,
    DemoFixtureProvider,
    CollectDataRoomUseCase,
    LatestSignalsQuery,
    DiscloseMetricsQuery,
    GrowthSignalsQuery,
    DataAccessUseCase,
    { provide: SNAPSHOT_REPOSITORY, useClass: PrismaSnapshotRepository },
    { provide: FOUNDER_METRIC_REPOSITORY, useClass: PrismaFounderMetricRepository },
    { provide: ACCESS_REQUEST_REPOSITORY, useClass: PrismaAccessRequestRepository },
    {
      provide: DATA_PROVIDERS,
      inject: [TokenApiProvider, MessariDexProvider, Agent0Provider, DemoFixtureProvider],
      useFactory: (...providers: DataProvider[]) => providers,
    },
  ],
  exports: [
    LatestSignalsQuery,
    CollectDataRoomUseCase,
    Agent0Client,
    DiscloseMetricsQuery,
    GrowthSignalsQuery,
    DataAccessUseCase,
  ],
})
export class DataRoomModule {}
