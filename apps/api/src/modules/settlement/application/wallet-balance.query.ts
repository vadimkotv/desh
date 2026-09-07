import { Injectable } from '@nestjs/common';
import { ARC_TESTNET } from '@agentipo/shared';
import { erc20Abi } from 'viem';
import { fromBaseUnits } from '../../../common/money';
import { ArcClients } from '../infrastructure/arc/arc-clients';

// Reads an agent wallet's USDC balance on Arc (used as a hard cap by the spending policy).
@Injectable()
export class WalletBalanceQuery {
  constructor(private readonly arc: ArcClients) {}

  async usdcBalance(address: string): Promise<number> {
    const units = await this.arc.public.readContract({
      address: ARC_TESTNET.usdc as `0x${string}`,
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [address as `0x${string}`],
    });
    return fromBaseUnits(units);
  }
}
