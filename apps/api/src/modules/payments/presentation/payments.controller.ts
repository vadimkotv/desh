import { Controller, Get, Inject, Query } from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { AppConfig } from '../../../config/app-config';
import { PAYMENT_RECEIPT_REPOSITORY, type PaymentReceiptRepository } from '../domain/payment-receipt.repository';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(
    @Inject(PAYMENT_RECEIPT_REPOSITORY) private readonly receipts: PaymentReceiptRepository,
    private readonly config: AppConfig,
  ) {}

  @Get('receipts')
  @ApiQuery({ name: 'limit', required: false })
  list(@Query('limit') limit?: string) {
    return this.receipts.list(limit ? Number(limit) : 100);
  }

  @Get('pricing')
  pricing() {
    const { env } = this.config;
    return {
      enabled: this.config.features.x402,
      network: this.config.hederaNetwork,
      facilitator: env.X402_FACILITATOR_URL,
      payTo: env.HEDERA_PAYTO_ACCOUNT_ID ?? null,
      asset: env.X402_ASSET,
      premiumReportPrice: env.X402_ASSET === 'HBAR' ? `${env.X402_HBAR_TINYBARS} tinybar` : env.X402_PREMIUM_REPORT_PRICE,
    };
  }
}
