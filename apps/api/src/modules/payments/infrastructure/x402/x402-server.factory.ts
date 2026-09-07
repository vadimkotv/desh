import { Inject, Injectable, Logger } from '@nestjs/common';
import { HEDERA_TESTNET } from '@agentipo/shared';
import { HTTPFacilitatorClient, x402ResourceServer } from '@x402/core/server';
import { ExactHederaScheme } from '@x402/hedera/exact/server';
import { AppConfig } from '../../../../config/app-config';
import { PAYMENT_RECEIPT_REPOSITORY, type PaymentReceiptRepository } from '../../domain/payment-receipt.repository';

// Builds the x402 resource server: Hedera "exact" scheme, settled by the Blocky402
// facilitator. Every settlement (success or failure) is persisted as a receipt.
@Injectable()
export class X402ServerFactory {
  private readonly log = new Logger(X402ServerFactory.name);
  private server?: x402ResourceServer;

  constructor(
    private readonly config: AppConfig,
    @Inject(PAYMENT_RECEIPT_REPOSITORY) private readonly receipts: PaymentReceiptRepository,
  ) {}

  get(): x402ResourceServer {
    this.server ??= this.build();
    return this.server;
  }

  private build(): x402ResourceServer {
    const facilitator = new HTTPFacilitatorClient({ url: this.config.env.X402_FACILITATOR_URL });
    const server = new x402ResourceServer(facilitator).register(
      'hedera:*',
      new ExactHederaScheme({
        defaultAssets: {
          'hedera:testnet': { asset: HEDERA_TESTNET.usdc, decimals: HEDERA_TESTNET.usdcDecimals },
          'hedera:mainnet': { asset: '0.0.456858', decimals: 6 },
        },
      }),
    );

    server.onAfterSettle(async ({ paymentPayload, requirements, result }) => {
      this.log.log(`x402 settled ${result.transaction} on ${result.network} from ${result.payer}`);
      await this.receipts.save({
        resource: paymentPayload.resource?.url ?? 'unknown',
        network: String(result.network),
        asset: requirements.asset,
        amount: requirements.amount,
        payer: result.payer ?? 'unknown',
        txId: result.transaction,
        success: result.success,
      });
    });
    server.onSettleFailure(async ({ paymentPayload, requirements, error }) => {
      this.log.warn(`x402 settlement failed: ${error.message}`);
      await this.receipts.save({
        resource: paymentPayload.resource?.url ?? 'unknown',
        network: String(requirements.network),
        asset: requirements.asset,
        amount: requirements.amount,
        payer: 'unknown',
        success: false,
      });
    });
    return server;
  }
}
