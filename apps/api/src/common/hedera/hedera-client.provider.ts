import { Injectable, type OnModuleDestroy } from '@nestjs/common';
import { AccountId, Client, PrivateKey } from '@hiero-ledger/sdk';
import { AppConfig } from '../../config/app-config';

// Platform operator client for Hedera (HCS audit topic, agent account creation).
// Agents never use this client to pay — they sign x402 payments with their own keys.
@Injectable()
export class HederaClientProvider implements OnModuleDestroy {
  private client?: Client;

  constructor(private readonly config: AppConfig) {}

  get enabled(): boolean {
    return this.config.features.hedera;
  }

  get operatorId(): string {
    return this.config.env.HEDERA_OPERATOR_ID as string;
  }

  get(): Client {
    if (this.client) return this.client;
    const { HEDERA_OPERATOR_ID, HEDERA_OPERATOR_KEY, HEDERA_NETWORK } = this.config.env;
    if (!HEDERA_OPERATOR_ID || !HEDERA_OPERATOR_KEY) throw new Error('Hedera operator is not configured');
    const client = HEDERA_NETWORK === 'mainnet' ? Client.forMainnet() : Client.forTestnet();
    client.setOperator(AccountId.fromString(HEDERA_OPERATOR_ID), parseKey(HEDERA_OPERATOR_KEY));
    this.client = client;
    return client;
  }

  onModuleDestroy(): void {
    this.client?.close();
  }
}

// Portal keys come as 0x-hex ECDSA or DER strings; accept both.
export function parseKey(key: string): PrivateKey {
  return key.startsWith('0x') ? PrivateKey.fromStringECDSA(key) : PrivateKey.fromStringDer(key);
}
