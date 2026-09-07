import { Inject, Injectable } from '@nestjs/common';
import type { CreateStartup, Startup } from '@agentipo/shared';
import { STARTUP_REPOSITORY, type StartupRepository } from '../domain/startup.repository';

@Injectable()
export class CreateStartupUseCase {
  constructor(@Inject(STARTUP_REPOSITORY) private readonly startups: StartupRepository) {}

  execute(input: CreateStartup): Promise<Startup> {
    return this.startups.create(input);
  }
}
