import { Injectable } from '@nestjs/common';
import { fromBaseUnits } from '../../../../common/money';
import type { EscrowReader, OnchainRound } from '../../domain/escrow-reader.port';
import { ArcClients } from './arc-clients';
import { ONCHAIN_STATUS, roundEscrowAbi } from './escrow.abi';

@Injectable()
export class ArcEscrowReader implements EscrowReader {
  constructor(private readonly arc: ArcClients) {}

  async getRound(onchainRoundId: number): Promise<OnchainRound> {
    const address = this.arc.escrowAddress;
    const id = BigInt(onchainRoundId);
    const contract = { address, abi: roundEscrowAbi } as const;
    const [round, milestones, investors] = await Promise.all([
      this.arc.public.readContract({ ...contract, functionName: 'getRound', args: [id] }),
      this.arc.public.readContract({ ...contract, functionName: 'getMilestones', args: [id] }),
      this.arc.public.readContract({ ...contract, functionName: 'investorCountOf', args: [id] }),
    ]);
    return {
      onchainRoundId,
      escrowAddress: address,
      founder: round.founder,
      targetUsdc: fromBaseUnits(round.target),
      raisedUsdc: fromBaseUnits(round.raised),
      deadline: new Date(Number(round.deadline) * 1000),
      status: ONCHAIN_STATUS[round.status] ?? 'Open',
      releasedCount: round.releasedCount,
      investorCount: Number(investors),
      milestoneBps: [...milestones],
    };
  }

  async contributionOf(onchainRoundId: number, investor: string): Promise<number> {
    const units = await this.arc.public.readContract({
      address: this.arc.escrowAddress,
      abi: roundEscrowAbi,
      functionName: 'contributionOf',
      args: [BigInt(onchainRoundId), investor as `0x${string}`],
    });
    return fromBaseUnits(units);
  }
}
