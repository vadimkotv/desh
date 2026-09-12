import type { ExitEvent, ExitKind } from '@agentipo/shared';

export const EXIT_EVENT_REPOSITORY = Symbol('EXIT_EVENT_REPOSITORY');

export interface NewExitEvent {
  roundId: string;
  kind: ExitKind;
  valuationUsdc: number;
  proceedsUsdc: number;
  evidenceUri: string;
  txHash: string | null;
}

export interface ExitEventRepository {
  create(input: NewExitEvent): Promise<ExitEvent>;
  listByRound(roundId: string): Promise<ExitEvent[]>;
}
