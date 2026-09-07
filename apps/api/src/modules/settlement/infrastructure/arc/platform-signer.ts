import { Injectable } from '@nestjs/common';
import { ARC_TESTNET } from '@agentipo/shared';
import { type Abi, erc20Abi } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { AppConfig } from '../../../../config/app-config';
import { ArcClients } from './arc-clients';

// Platform-operator writes on Arc. One place that owns the platform key and the
// "send + wait for success" ceremony used by every operator action.
@Injectable()
export class PlatformSigner {
  constructor(
    private readonly arc: ArcClients,
    private readonly config: AppConfig,
  ) {}

  get account() {
    const key = this.config.env.ARC_PLATFORM_PRIVATE_KEY;
    if (!key) throw new Error('ARC_PLATFORM_PRIVATE_KEY is not configured');
    return privateKeyToAccount(key as `0x${string}`);
  }

  async write(address: `0x${string}`, abi: Abi, functionName: string, args: readonly unknown[]): Promise<`0x${string}`> {
    const account = this.account;
    const hash = await this.arc.wallet(account).writeContract({ account, chain: this.arc.chain, address, abi, functionName, args });
    if (!(await this.arc.waitForSuccess(hash))) throw new Error(`${functionName} reverted: ${hash}`);
    return hash;
  }

  // Ensures the escrow may pull `units` USDC from the platform wallet (used by distribute()).
  async ensureUsdcAllowance(units: bigint): Promise<void> {
    const usdc = ARC_TESTNET.usdc as `0x${string}`;
    const allowance = await this.arc.public.readContract({
      address: usdc, abi: erc20Abi, functionName: 'allowance', args: [this.account.address, this.arc.escrowAddress],
    });
    if (allowance < units) await this.write(usdc, erc20Abi, 'approve', [this.arc.escrowAddress, units]);
  }
}
