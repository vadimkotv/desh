import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { CreateRound } from '@agentipo/shared';
import { ROUND_REPOSITORY, type RoundDetail, type RoundOnchainRef, type RoundRepository } from '../domain/round.repository';
import { STARTUP_REPOSITORY, type StartupRepository } from '../domain/startup.repository';
import { ESCROW_ROUND_FACTORY, type EscrowRoundFactory } from '../domain/escrow-round-factory.port';

// Creating a round has an on-chain side effect (RoundEscrow.createRound on Arc).
// The factory is optional so the platform still works without a deployed escrow.
@Injectable()
export class CreateRoundUseCase {
  private readonly log = new Logger(CreateRoundUseCase.name);

  constructor(
    @Inject(ROUND_REPOSITORY) private readonly rounds: RoundRepository,
    @Inject(STARTUP_REPOSITORY) private readonly startups: StartupRepository,
    @Inject(ESCROW_ROUND_FACTORY) private readonly escrow: EscrowRoundFactory | null,
  ) {}

  async execute(input: CreateRound): Promise<RoundDetail> {
    const startup = await this.startups.findById(input.startupId);
    if (!startup) throw new NotFoundException(`Startup ${input.startupId} not found`);

    let onchain: RoundOnchainRef | undefined;
    if (this.escrow) {
      onchain = await this.escrow.createRound({
        founder: startup.founderAddress,
        targetUsdc: input.targetUsdc,
        deadline: new Date(input.deadline),
        milestoneBps: input.milestones.map((m) => m.releaseBps),
        returnCapBps: input.returnCapBps,
      });
      this.log.log(`Round created on Arc escrow: id=${onchain.onchainRoundId}`);
    }
    return this.rounds.create(input, onchain);
  }
}
