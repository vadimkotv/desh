import { Module } from '@nestjs/common';
import { PAID_DATA_CLIENT } from './domain/paid-data.port';
import { PAYMENT_RECEIPT_REPOSITORY } from './domain/payment-receipt.repository';
import { PrismaPaymentReceiptRepository } from './infrastructure/prisma-payment-receipt.repository';
import { PaidFetchFactory } from './infrastructure/x402/paid-fetch.factory';
import { PremiumReportClient } from './infrastructure/x402/premium-report.client';
import { X402Middleware } from './infrastructure/x402/x402.middleware';
import { X402ServerFactory } from './infrastructure/x402/x402-server.factory';
import { PaymentsController } from './presentation/payments.controller';

@Module({
  controllers: [PaymentsController],
  providers: [
    X402ServerFactory,
    X402Middleware,
    PaidFetchFactory,
    PremiumReportClient,
    { provide: PAYMENT_RECEIPT_REPOSITORY, useClass: PrismaPaymentReceiptRepository },
    { provide: PAID_DATA_CLIENT, useExisting: PremiumReportClient },
  ],
  exports: [X402Middleware, X402ServerFactory, PAID_DATA_CLIENT, PremiumReportClient, PAYMENT_RECEIPT_REPOSITORY],
})
export class PaymentsModule {}
