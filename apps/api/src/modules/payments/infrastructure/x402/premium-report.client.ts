import { Inject, Injectable, Logger } from '@nestjs/common';
import type { DueDiligenceReport } from '@agentipo/shared';
import { AppConfig } from '../../../../config/app-config';
import { getJson } from '../../../../common/http/json-http';
import type { HederaPayer, PaidDataClient, PaidFetchResult } from '../../domain/paid-data.port';
import { PAYMENT_RECEIPT_REPOSITORY, type PaymentReceiptRepository } from '../../domain/payment-receipt.repository';
import { PaidFetchFactory } from './paid-fetch.factory';

// The agent side of the marketplace: buys the premium report over HTTP exactly like a
// third-party agent would, paying the x402 invoice from its own Hedera account.
@Injectable()
export class PremiumReportClient implements PaidDataClient {
  private readonly log = new Logger(PremiumReportClient.name);

  constructor(
    private readonly config: AppConfig,
    private readonly paidFetch: PaidFetchFactory,
    @Inject(PAYMENT_RECEIPT_REPOSITORY) private readonly receipts: PaymentReceiptRepository,
  ) {}

  async fetchPremiumReport(roundId: string, payer: HederaPayer | null): Promise<PaidFetchResult<DueDiligenceReport>> {
    const url = `${this.config.env.API_PUBLIC_URL}/due-diligence/rounds/${roundId}/premium`;
    if (!payer || !this.config.features.x402) {
      this.log.warn(`fetching ${url} without payment (x402 disabled or agent has no Hedera account)`);
      return { data: await getJson<DueDiligenceReport>(url), payment: null };
    }
    const paid = this.paidFetch.forPayer(payer, 1);
    const result = await this.paidFetch.fetchJson<DueDiligenceReport>(paid, url);
    if (result.payment?.txId) this.log.log(`paid for report ${roundId}: tx ${result.payment.txId}`);
    return result;
  }

  attachAgent(txId: string, agentId: string): Promise<void> {
    return this.receipts.attachAgent(txId, agentId);
  }
}
