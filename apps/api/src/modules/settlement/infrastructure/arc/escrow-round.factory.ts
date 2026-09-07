import { Injectable, Logger } from '@nestjs/common';
import { decodeEventLog } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { AppConfig } from '../../../../config/app-config';
import { toBaseUnits } from '../../../../common/money';
import type { RoundOnchainRef } from '../../../startups/domain/round.repository';
import type { CreateEscrowRoundParams, EscrowRoundFactory } from '../../../startups/domain/escrow-round-factory.port';
import { ArcClients } from './arc-clients';
import { roundEscrowAbi } from './escrow.abi';

// Platform-signed write: RoundEscrow.createRound. Only the platform operator may call it.
@Injectable()
export class ArcEscrowRoundFactory implements EscrowRoundFactory {
  private readonly log = new Logger(ArcEscrowRoundFactory.name);

  constructor(
    private readonly arc: ArcClients,
    private readonly config: AppConfig,
  ) {}

  async createRound(p: CreateEscrowRoundParams): Promise<RoundOnchainRef> {
    const key = this.config.env.ARC_PLATFORM_PRIVATE_KEY as `0x${string}`;
    const account = privateKeyToAccount(key);
    const wallet = this.arc.wallet(account);
    const escrowAddress = this.arc.escrowAddress;

    const txHash = await wallet.writeContract({
      account,
      chain: this.arc.chain,
      address: escrowAddress,
      abi: roundEscrowAbi,
      functionName: 'createRound',
      args: [
        p.founder as `0x${string}`,
        toBaseUnits(p.targetUsdc),
        BigInt(Math.floor(p.deadline.getTime() / 1000)),
        p.milestoneBps,
      ],
    });
    this.log.log(`createRound tx ${txHash}`);
    const receipt = await this.arc.public.waitForTransactionReceipt({ hash: txHash, timeout: 90_000 });
    if (receipt.status !== 'success') throw new Error(`createRound reverted: ${txHash}`);

    const onchainRoundId = this.extractRoundId(receipt.logs, escrowAddress);
    return { onchainRoundId, escrowAddress };
  }

  private extractRoundId(logs: { address: string; data: `0x${string}`; topics: readonly `0x${string}`[] }[], escrow: string): number {
    for (const log of logs) {
      if (log.address.toLowerCase() !== escrow.toLowerCase()) continue;
      try {
        const ev = decodeEventLog({ abi: roundEscrowAbi, data: log.data, topics: log.topics as [`0x${string}`, ...`0x${string}`[]] });
        if (ev.eventName === 'RoundCreated') return Number(ev.args.roundId);
      } catch {
        /* not our event */
      }
    }
    throw new Error('RoundCreated event not found in receipt');
  }
}
