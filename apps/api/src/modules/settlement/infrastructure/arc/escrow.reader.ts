import { Injectable } from '@nestjs/common';
import { fromBaseUnits } from '../../../../common/money';
import type { EscrowReader, InvestorPosition, OnchainRound } from '../../domain/escrow-reader.port';
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
    const raisedUsdc = fromBaseUnits(round.raised);
    return {
      onchainRoundId,
      escrowAddress: address,
      founder: round.founder,
      targetUsdc: fromBaseUnits(round.target),
      raisedUsdc,
      deadline: new Date(Number(round.deadline) * 1000),
      status: ONCHAIN_STATUS[round.status] ?? 'Open',
      releasedCount: round.releasedCount,
      investorCount: Number(investors),
      milestoneBps: [...milestones],
      returnCapBps: round.returnCapBps,
      capUsdc: (raisedUsdc * round.returnCapBps) / 10_000,
      distributedUsdc: fromBaseUnits(round.distributed),
    };
  }

  async contributionOf(onchainRoundId: number, investor: string): Promise<number> {
    return (await this.positionOf(onchainRoundId, investor)).contributionUsdc;
  }

  async positionOf(onchainRoundId: number, investor: string): Promise<InvestorPosition> {
    const contract = { address: this.arc.escrowAddress, abi: roundEscrowAbi } as const;
    const args = [BigInt(onchainRoundId), investor as `0x${string}`] as const;
    const [contribution, claimable, claimed] = await Promise.all([
      this.arc.public.readContract({ ...contract, functionName: 'contributionOf', args }),
      this.arc.public.readContract({ ...contract, functionName: 'claimableOf', args }),
      this.arc.public.readContract({ ...contract, functionName: 'claimedOf', args }),
    ]);
    return {
      contributionUsdc: fromBaseUnits(contribution),
      claimableUsdc: fromBaseUnits(claimable),
      claimedUsdc: fromBaseUnits(claimed),
    };
  }
}
