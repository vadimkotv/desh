import { Injectable } from '@nestjs/common';
import { x402Client } from '@x402/core/client';
import { decodePaymentResponseHeader, wrapFetchWithPayment } from '@x402/fetch';
import { createClientHederaSigner, PrivateKey } from '@x402/hedera';
import { ExactHederaScheme } from '@x402/hedera/exact/client';
import { AppConfig } from '../../../../config/app-config';
import type { HederaPayer, PaidFetchResult } from '../../domain/paid-data.port';

// Turns an agent's Hedera credentials into a fetch that transparently pays 402s.
@Injectable()
export class PaidFetchFactory {
  constructor(private readonly config: AppConfig) {}

  forPayer(payer: HederaPayer, maxUsdPerPayment: number): typeof fetch {
    const signer = createClientHederaSigner(payer.accountId, PrivateKey.fromStringECDSA(payer.privateKeyHex), {
      network: this.config.hederaNetwork,
    });
    const client = new x402Client()
      .register('hedera:*', new ExactHederaScheme(signer))
      .setSpendControls({ maxAmountPerPayment: `$${maxUsdPerPayment}`, allowedAssets: true });
    return wrapFetchWithPayment(fetch, client);
  }

  async fetchJson<T>(doFetch: typeof fetch, url: string): Promise<PaidFetchResult<T>> {
    const res = await doFetch(url, { headers: { accept: 'application/json' } });
    if (!res.ok) throw new Error(`Paid request failed: HTTP ${res.status} ${await res.text()}`);
    const data = (await res.json()) as T;
    const header = res.headers.get('PAYMENT-RESPONSE');
    if (!header) return { data, payment: null };
    const settle = decodePaymentResponseHeader(header);
    return {
      data,
      payment: {
        txId: settle.transaction || null,
        network: String(settle.network),
        amount: settle.amount ?? '',
        asset: '',
        payer: settle.payer ?? payerUnknown,
      },
    };
  }
}

const payerUnknown = 'unknown';
