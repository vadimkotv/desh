import { Injectable, Logger } from '@nestjs/common';
import { ARC_TESTNET } from '@agentipo/shared';
import { erc20Abi } from 'viem';
import { toBaseUnits } from '../../../../common/money';
import type { AgentWalletRef, InvestParams, SettlementRail, TxSubmission } from '../../domain/settlement.port';
import { AgentKeyDerivation } from '../keys/agent-key.derivation';
import { ArcClients } from './arc-clients';
import { roundEscrowAbi } from './escrow.abi';

// Settlement rail for agents that hold a locally derived key: approve USDC, then invest.
@Injectable()
export class LocalKeySettlement implements SettlementRail {
  readonly kind = 'LOCAL_KEY' as const;
  private readonly log = new Logger(LocalKeySettlement.name);

  constructor(
    private readonly arc: ArcClients,
    private readonly keys: AgentKeyDerivation,
  ) {}

  async invest({ wallet, onchainRoundId, amountUsdc }: InvestParams): Promise<TxSubmission> {
    const account = this.keys.account(wallet.keyIndex);
    const client = this.arc.wallet(account);
    const escrow = this.arc.escrowAddress;
    const amount = toBaseUnits(amountUsdc);
    const usdc = ARC_TESTNET.usdc as `0x${string}`;

    const allowance = await this.arc.public.readContract({
      address: usdc, abi: erc20Abi, functionName: 'allowance', args: [account.address, escrow],
    });
    if (allowance < amount) {
      const approveTx = await client.writeContract({
        account, chain: this.arc.chain, address: usdc, abi: erc20Abi, functionName: 'approve', args: [escrow, amount],
      });
      this.log.log(`approve tx ${approveTx}`);
      if (!(await this.arc.waitForSuccess(approveTx))) throw new Error(`USDC approve reverted: ${approveTx}`);
    }

    const txHash = await client.writeContract({
      account, chain: this.arc.chain, address: escrow, abi: roundEscrowAbi,
      functionName: 'invest', args: [BigInt(onchainRoundId), amount],
    });
    this.log.log(`invest tx ${txHash} (round ${onchainRoundId}, ${amountUsdc} USDC)`);
    return { txHash, chainId: this.arc.chain.id };
  }

  async claim(wallet: AgentWalletRef, onchainRoundId: number): Promise<TxSubmission> {
    const account = this.keys.account(wallet.keyIndex);
    const txHash = await this.arc.wallet(account).writeContract({
      account, chain: this.arc.chain, address: this.arc.escrowAddress, abi: roundEscrowAbi,
      functionName: 'claim', args: [BigInt(onchainRoundId)],
    });
    this.log.log(`claim tx ${txHash} (round ${onchainRoundId}, ${account.address})`);
    return { txHash, chainId: this.arc.chain.id };
  }

  waitForConfirmation(txHash: string): Promise<boolean> {
    return this.arc.waitForSuccess(txHash as `0x${string}`);
  }
}
