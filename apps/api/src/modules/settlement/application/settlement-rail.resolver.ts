import { Inject, Injectable } from '@nestjs/common';
import type { WalletKind } from '@agentipo/shared';
import { SETTLEMENT_RAIL, type SettlementRail } from '../domain/settlement.port';

// Strategy lookup: which rail settles for which wallet kind.
@Injectable()
export class SettlementRailResolver {
  constructor(@Inject(SETTLEMENT_RAIL) private readonly rails: SettlementRail[]) {}

  resolve(kind: WalletKind): SettlementRail {
    const rail = this.rails.find((r) => r.kind === kind);
    if (!rail) throw new Error(`No settlement rail configured for wallet kind ${kind}`);
    return rail;
  }

  get available(): WalletKind[] {
    return this.rails.map((r) => r.kind);
  }
}
