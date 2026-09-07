import { Injectable, Logger } from '@nestjs/common';
import { CIRCLE_BLOCKCHAIN, CircleClientProvider } from './circle-client';

export interface CreatedCircleWallet {
  walletId: string;
  address: string;
}

// Creates an agent wallet inside the platform's Circle wallet set on Arc testnet.
@Injectable()
export class CircleWalletFactory {
  private readonly log = new Logger(CircleWalletFactory.name);

  constructor(private readonly circle: CircleClientProvider) {}

  async create(agentName: string): Promise<CreatedCircleWallet> {
    const res = await this.circle.get().createWallets({
      walletSetId: this.circle.walletSetId,
      blockchains: [CIRCLE_BLOCKCHAIN],
      count: 1,
      accountType: 'EOA',
      metadata: [{ name: agentName, refId: agentName }],
    });
    const wallet = res.data?.wallets?.[0];
    if (!wallet) throw new Error('Circle did not return a wallet');
    this.log.log(`Circle wallet ${wallet.id} (${wallet.address}) created for ${agentName}`);
    return { walletId: wallet.id, address: wallet.address };
  }
}
