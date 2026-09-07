import { Module } from '@nestjs/common';
import { StartupsModule } from '../startups/startups.module';
import { CollectDataRoomUseCase } from './application/collect-data-room.usecase';
import { LatestSignalsQuery } from './application/latest-signals.query';
import { DATA_PROVIDERS, type DataProvider } from './domain/data-provider.port';
import { SNAPSHOT_REPOSITORY } from './domain/snapshot.repository';
import { DemoFixtureProvider } from './infrastructure/demo/demo-fixture.provider';
import { Agent0Client } from './infrastructure/graph-agent0/agent0.client';
import { Agent0Provider } from './infrastructure/graph-agent0/agent0.provider';
import { MessariDexProvider } from './infrastructure/graph-messari/messari-dex.provider';
import { TokenApiClient } from './infrastructure/graph-token-api/token-api.client';
import { TokenApiProvider } from './infrastructure/graph-token-api/token-api.provider';
import { PrismaSnapshotRepository } from './infrastructure/prisma-snapshot.repository';
import { DataRoomController } from './presentation/data-room.controller';

@Module({
  imports: [StartupsModule],
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
    { provide: SNAPSHOT_REPOSITORY, useClass: PrismaSnapshotRepository },
    {
      provide: DATA_PROVIDERS,
      inject: [TokenApiProvider, MessariDexProvider, Agent0Provider, DemoFixtureProvider],
      useFactory: (...providers: DataProvider[]) => providers,
    },
  ],
  exports: [LatestSignalsQuery, CollectDataRoomUseCase, Agent0Client],
})
export class DataRoomModule {}
