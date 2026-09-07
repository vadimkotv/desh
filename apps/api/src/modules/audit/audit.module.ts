import { Module } from '@nestjs/common';
import { AppConfig } from '../../config/app-config';
import { RecordAuditUseCase } from './application/record-audit.usecase';
import { AUDIT_LOG, AUDIT_REPOSITORY, CONSENSUS_PUBLISHER } from './domain/audit.port';
import { HcsPublisher } from './infrastructure/hcs.publisher';
import { PrismaAuditRepository } from './infrastructure/prisma-audit.repository';
import { AuditController } from './presentation/audit.controller';

@Module({
  controllers: [AuditController],
  providers: [
    HcsPublisher,
    RecordAuditUseCase,
    { provide: AUDIT_REPOSITORY, useClass: PrismaAuditRepository },
    { provide: AUDIT_LOG, useExisting: RecordAuditUseCase },
    {
      provide: CONSENSUS_PUBLISHER,
      inject: [AppConfig, HcsPublisher],
      useFactory: (cfg: AppConfig, hcs: HcsPublisher) => (cfg.features.hcs ? hcs : null),
    },
  ],
  exports: [AUDIT_LOG, AUDIT_REPOSITORY],
})
export class AuditModule {}
