import { Module } from '@nestjs/common';
import { AppConfig } from '../../config/app-config';
import { ESCROW_ROUND_FACTORY } from '../startups/domain/escrow-round-factory.port';
import { SettlementRailResolver } from './application/settlement-rail.resolver';
import { SubmitInvestmentUseCase } from './application/submit-investment.usecase';
import { WalletBalanceQuery } from './application/wallet-balance.query';
import { ESCROW_READER } from './domain/escrow-reader.port';
import { INVESTMENT_REPOSITORY } from './domain/investment.repository';
import { SETTLEMENT_RAIL, type SettlementRail } from './domain/settlement.port';
import { ArcClients } from './infrastructure/arc/arc-clients';
import { ArcEscrowReader } from './infrastructure/arc/escrow.reader';
import { ArcEscrowRoundFactory } from './infrastructure/arc/escrow-round.factory';
import { ArcEscrowOperator } from './infrastructure/arc/escrow.operator';
import { PlatformSigner } from './infrastructure/arc/platform-signer';
import { ESCROW_OPERATOR } from './domain/escrow-operator.port';
import { LocalKeySettlement } from './infrastructure/arc/local-key.settlement';
import { CircleClientProvider } from './infrastructure/circle/circle-client';
import { CircleWalletFactory } from './infrastructure/circle/circle-wallet.factory';
import { CircleWalletSettlement } from './infrastructure/circle/circle-wallet.settlement';
import { AgentKeyDerivation } from './infrastructure/keys/agent-key.derivation';
import { PrismaInvestmentRepository } from './infrastructure/prisma-investment.repository';
import { SettlementController } from './presentation/settlement.controller';

// Adapters are registered only when their credentials exist, so the API boots in
// degraded mode and /health reports which rails are live.
@Module({
  controllers: [SettlementController],
  providers: [
    ArcClients,
    AgentKeyDerivation,
    CircleClientProvider,
    CircleWalletFactory,
    LocalKeySettlement,
    CircleWalletSettlement,
    ArcEscrowReader,
    ArcEscrowRoundFactory,
    ArcEscrowOperator,
    PlatformSigner,
    WalletBalanceQuery,
    SettlementRailResolver,
    SubmitInvestmentUseCase,
    { provide: INVESTMENT_REPOSITORY, useClass: PrismaInvestmentRepository },
    {
      provide: SETTLEMENT_RAIL,
      inject: [AppConfig, LocalKeySettlement, CircleWalletSettlement],
      useFactory: (cfg: AppConfig, local: LocalKeySettlement, circle: CircleWalletSettlement) => {
        const rails: SettlementRail[] = [];
        if (cfg.features.agentKeys && cfg.env.ARC_ESCROW_ADDRESS) rails.push(local);
        if (cfg.features.circleWallets && cfg.env.ARC_ESCROW_ADDRESS) rails.push(circle);
        return rails;
      },
    },
    {
      provide: ESCROW_READER,
      inject: [AppConfig, ArcEscrowReader],
      useFactory: (cfg: AppConfig, reader: ArcEscrowReader) => (cfg.env.ARC_ESCROW_ADDRESS ? reader : null),
    },
    {
      provide: ESCROW_OPERATOR,
      inject: [AppConfig, ArcEscrowOperator],
      useFactory: (cfg: AppConfig, op: ArcEscrowOperator) => (cfg.features.arcEscrow ? op : null),
    },
    {
      provide: ESCROW_ROUND_FACTORY,
      inject: [AppConfig, ArcEscrowRoundFactory],
      useFactory: (cfg: AppConfig, factory: ArcEscrowRoundFactory) => (cfg.features.arcEscrow ? factory : null),
    },
  ],
  exports: [
    ESCROW_ROUND_FACTORY,
    ESCROW_READER,
    ESCROW_OPERATOR,
    INVESTMENT_REPOSITORY,
    SubmitInvestmentUseCase,
    WalletBalanceQuery,
    SettlementRailResolver,
    AgentKeyDerivation,
    CircleWalletFactory,
    CircleClientProvider,
  ],
})
export class SettlementModule {}
