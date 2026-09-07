import { Injectable } from '@nestjs/common';
import { initiateDeveloperControlledWalletsClient } from '@circle-fin/developer-controlled-wallets';
import { AppConfig } from '../../../../config/app-config';

export const CIRCLE_BLOCKCHAIN = 'ARC-TESTNET' as const;

type CircleClient = ReturnType<typeof initiateDeveloperControlledWalletsClient>;

// Lazily built Circle Developer-Controlled Wallets client (part of the Circle Agent Stack).
@Injectable()
export class CircleClientProvider {
  private client?: CircleClient;

  constructor(private readonly config: AppConfig) {}

  get enabled(): boolean {
    return this.config.features.circleWallets;
  }

  get walletSetId(): string {
    const id = this.config.env.CIRCLE_WALLET_SET_ID;
    if (!id) throw new Error('CIRCLE_WALLET_SET_ID is not configured');
    return id;
  }

  get(): CircleClient {
    const { CIRCLE_API_KEY, CIRCLE_ENTITY_SECRET } = this.config.env;
    if (!CIRCLE_API_KEY || !CIRCLE_ENTITY_SECRET) throw new Error('Circle credentials are not configured');
    this.client ??= initiateDeveloperControlledWalletsClient({
      apiKey: CIRCLE_API_KEY,
      entitySecret: CIRCLE_ENTITY_SECRET,
    });
    return this.client;
  }
}
