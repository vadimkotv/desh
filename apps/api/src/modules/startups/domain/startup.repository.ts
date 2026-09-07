import type { CreateStartup, Startup } from '@agentipo/shared';

export const STARTUP_REPOSITORY = Symbol('STARTUP_REPOSITORY');

export interface StartupRepository {
  create(input: CreateStartup): Promise<Startup>;
  findById(id: string): Promise<Startup | null>;
  findAll(): Promise<Startup[]>;
}
