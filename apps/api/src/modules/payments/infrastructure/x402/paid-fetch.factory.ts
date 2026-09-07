import { Injectable } from '@nestjs/common';
import { x402Client } from '@x402/core/client';
import { decodePaymentResponseHeader, wrapFetchWithPayment } from '@x402/fetch';
import { createClientHederaSigner, PrivateKey } from '@x402/hedera';
import { ExactHederaScheme } from '@x402/hedera/exact/client';
import { AppConfig } from '../../../../config/app-config';
import type { HederaPayer, PaidFetchResult } from '../../domain/paid-data.port';

export interface PaidFetch {
  fetch: typeof fetch;
  // What the client agreed to pay on the last 402 it answered (asset + atomic amount).
  lastAccepted: () => { amount: string; asset: string } | null;
}

// Turns an agent's Hedera credentials into a fetch that transparently pays 402s.
@Injectable()
export class PaidFetchFactory {
  constructor(private readonly config: AppConfig) {}

  forPayer(payer: HederaPayer, maxUsdPerPayment: number): PaidFetch {
    const signer = createClientHederaSigner(payer.accountId, PrivateKey.fromStringECDSA(payer.privateKeyHex), {
      network: this.config.hederaNetwork,
    });
    let accepted: { amount: string; asset: string } | null = null;
    const client = new x402Client()
      .register('hedera:*', new ExactHederaScheme(signer))
      .setSpendControls({ maxAmountPerPayment: `$${maxUsdPerPayment}`, allowedAssets: true })
      .onAfterPaymentCreation(async ({ selectedRequirements }) => {
        accepted = { amount: selectedRequirements.amount, asset: selectedRequirements.asset };
      });
    return { fetch: wrapFetchWithPayment(fetch, client), lastAccepted: () => accepted };
  }

  async fetchJson<T>(paid: PaidFetch, url: string): Promise<PaidFetchResult<T>> {
    const res = await paid.fetch(url, { headers: { accept: 'application/json' } });
    if (!res.ok) throw new Error(`Paid request failed: HTTP ${res.status} ${await res.text()}`);
    const data = (await res.json()) as T;
    const header = res.headers.get('PAYMENT-RESPONSE');
    if (!header) return { data, payment: null };
    const settle = decodePaymentResponseHeader(header);
    const accepted = paid.lastAccepted();
    return {
      data,
      payment: {
        txId: settle.transaction || null,
        network: String(settle.network),
        amount: settle.amount ?? accepted?.amount ?? '',
        asset: accepted?.asset ?? '',
        payer: settle.payer ?? 'unknown',
      },
    };
  }
}
