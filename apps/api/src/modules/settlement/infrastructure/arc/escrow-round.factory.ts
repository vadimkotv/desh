import { Injectable, Logger } from '@nestjs/common';
import { decodeEventLog } from 'viem';
import { toBaseUnits } from '../../../../common/money';
import type { RoundOnchainRef } from '../../../startups/domain/round.repository';
import type { CreateEscrowRoundParams, EscrowRoundFactory } from '../../../startups/domain/escrow-round-factory.port';
import { ArcClients } from './arc-clients';
import { roundEscrowAbi } from './escrow.abi';
import { PlatformSigner } from './platform-signer';

// Platform-signed write: RoundEscrow.createRound. Only the platform operator may call it.
@Injectable()
export class ArcEscrowRoundFactory implements EscrowRoundFactory {
  private readonly log = new Logger(ArcEscrowRoundFactory.name);

  constructor(
    private readonly arc: ArcClients,
    private readonly signer: PlatformSigner,
  ) {}

  async createRound(p: CreateEscrowRoundParams): Promise<RoundOnchainRef> {
    const escrowAddress = this.arc.escrowAddress;
    const txHash = await this.signer.write(escrowAddress, roundEscrowAbi, 'createRound', [
      p.founder as `0x${string}`,
      toBaseUnits(p.targetUsdc),
      BigInt(Math.floor(p.deadline.getTime() / 1000)),
      p.milestoneBps,
      p.equityBps,
    ]);
    this.log.log(`createRound tx ${txHash}`);
    const receipt = await this.arc.public.getTransactionReceipt({ hash: txHash });
    return { onchainRoundId: this.extractRoundId(receipt.logs, escrowAddress), escrowAddress };
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
