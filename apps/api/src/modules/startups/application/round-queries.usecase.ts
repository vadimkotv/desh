import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { RoundStatus, Startup } from '@agentipo/shared';
import { ROUND_REPOSITORY, type RoundDetail, type RoundRepository } from '../domain/round.repository';
import { STARTUP_REPOSITORY, type StartupRepository } from '../domain/startup.repository';

// Read-side facade used by controllers and by other modules (data-room, agents).
@Injectable()
export class RoundQueries {
  constructor(
    @Inject(ROUND_REPOSITORY) private readonly rounds: RoundRepository,
    @Inject(STARTUP_REPOSITORY) private readonly startups: StartupRepository,
  ) {}

  list(status?: RoundStatus): Promise<RoundDetail[]> {
    return this.rounds.findAll(status);
  }

  async getRound(id: string): Promise<RoundDetail> {
    const round = await this.rounds.findById(id);
    if (!round) throw new NotFoundException(`Round ${id} not found`);
    return round;
  }

  async getStartup(id: string): Promise<Startup> {
    const startup = await this.startups.findById(id);
    if (!startup) throw new NotFoundException(`Startup ${id} not found`);
    return startup;
  }

  listStartups(): Promise<Startup[]> {
    return this.startups.findAll();
  }

  openForSectors(sectors: string[]): Promise<RoundDetail[]> {
    return this.rounds.findOpenBySectors(sectors);
  }

  recordRaised(roundId: string, amountUsdc: number): Promise<void> {
    return this.rounds.addRaised(roundId, amountUsdc);
  }
}
