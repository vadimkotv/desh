import { Injectable, Logger } from '@nestjs/common';
import { ARC_TESTNET } from '@agentipo/shared';
import { toBaseUnits } from '../../../../common/money';
import type { InvestParams, SettlementRail, TxSubmission } from '../../domain/settlement.port';
import { ArcClients } from '../arc/arc-clients';
import { CircleClientProvider } from './circle-client';

const FEE = { type: 'level', config: { feeLevel: 'MEDIUM' } } as const;

// Settlement rail for Circle developer-controlled wallets: two contract executions
// (USDC.approve, RoundEscrow.invest) signed by Circle, tracked until a tx hash exists.
@Injectable()
export class CircleWalletSettlement implements SettlementRail {
  readonly kind = 'CIRCLE' as const;
  private readonly log = new Logger(CircleWalletSettlement.name);

  constructor(
    private readonly circle: CircleClientProvider,
    private readonly arc: ArcClients,
  ) {}

  async invest({ wallet, onchainRoundId, amountUsdc }: InvestParams): Promise<TxSubmission> {
    if (!wallet.circleWalletId) throw new Error('agent has no Circle wallet');
    const escrow = this.arc.escrowAddress;
    const amount = toBaseUnits(amountUsdc).toString();

    await this.execute(wallet.circleWalletId, ARC_TESTNET.usdc, 'approve(address,uint256)', [escrow, amount]);
    const txHash = await this.execute(wallet.circleWalletId, escrow, 'invest(uint256,uint256)', [
      String(onchainRoundId),
      amount,
    ]);
    return { txHash, chainId: this.arc.chain.id };
  }

  waitForConfirmation(txHash: string): Promise<boolean> {
    return this.arc.waitForSuccess(txHash as `0x${string}`);
  }

  private async execute(walletId: string, contractAddress: string, signature: string, params: string[]) {
    const client = this.circle.get();
    const created = await client.createContractExecutionTransaction({
      walletId,
      contractAddress,
      abiFunctionSignature: signature,
      abiParameters: params,
      fee: FEE,
    });
    const id = created.data?.id;
    if (!id) throw new Error('Circle did not return a transaction id');
    const tx = await client.getTransaction({ id, waitForTxHash: true });
    const hash = tx.data?.transaction?.txHash;
    if (!hash) throw new Error(`Circle tx ${id} has no hash yet`);
    this.log.log(`${signature} via Circle wallet ${walletId}: ${hash}`);
    return hash;
  }
}
