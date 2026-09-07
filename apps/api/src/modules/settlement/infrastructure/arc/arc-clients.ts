import { Injectable } from '@nestjs/common';
import { type Account, createPublicClient, createWalletClient, http, type PublicClient, type WalletClient } from 'viem';
import { AppConfig } from '../../../../config/app-config';
import { arcTestnet } from './arc-chain';

// One place that knows how to talk to Arc. Everything else receives clients from here.
@Injectable()
export class ArcClients {
  readonly chain;
  private readonly transport;
  private publicClient?: PublicClient;

  constructor(private readonly config: AppConfig) {
    this.chain = arcTestnet(config.env.ARC_RPC_URL);
    this.transport = http(config.env.ARC_RPC_URL);
  }

  get public(): PublicClient {
    this.publicClient ??= createPublicClient({ chain: this.chain, transport: this.transport });
    return this.publicClient;
  }

  wallet(account: Account): WalletClient {
    return createWalletClient({ account, chain: this.chain, transport: this.transport });
  }

  get escrowAddress(): `0x${string}` {
    const address = this.config.env.ARC_ESCROW_ADDRESS;
    if (!address) throw new Error('ARC_ESCROW_ADDRESS is not configured');
    return address as `0x${string}`;
  }

  async waitForSuccess(txHash: `0x${string}`): Promise<boolean> {
    const receipt = await this.public.waitForTransactionReceipt({ hash: txHash, timeout: 90_000 });
    return receipt.status === 'success';
  }
}
