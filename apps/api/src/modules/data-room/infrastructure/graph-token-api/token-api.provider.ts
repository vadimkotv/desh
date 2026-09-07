import { Injectable } from '@nestjs/common';
import { type Signal, SignalKeys } from '@agentipo/shared';
import { type DataProvider, signal, type StartupContext } from '../../domain/data-provider.port';
import { TokenApiClient } from './token-api.client';
import { ownTokenShareBps, stableBalanceUsd, top10ConcentrationBps, uniqueSenders } from './token-metrics';

// Graph product #1: Token API. Distribution + activity of the startup token and the
// composition of its treasury wallet.
@Injectable()
export class TokenApiProvider implements DataProvider {
  readonly source = 'graph-token-api' as const;

  constructor(private readonly api: TokenApiClient) {}

  supports(): boolean {
    return this.api.enabled;
  }

  async collect({ startup }: StartupContext): Promise<Signal[]> {
    const network = startup.tokenNetwork;
    const out: Signal[] = [];
    const s = (key: string, value: number, unit: string, meta?: Record<string, unknown>) =>
      out.push(signal(this.source, key, value, unit, meta));

    const balances = await this.api.balances(startup.treasuryAddress, network);
    s(SignalKeys.treasuryStableUsd, stableBalanceUsd(balances), 'usd');
    s(SignalKeys.treasuryTokenCount, balances.length, 'count');
    s(SignalKeys.treasuryOwnTokenShareBps, ownTokenShareBps(balances, startup.tokenAddress), 'bps');

    if (startup.tokenAddress) {
      const [holders, transfers] = await Promise.all([
        this.api.holders(startup.tokenAddress, network),
        this.api.transfers(startup.tokenAddress, network),
      ]);
      s(SignalKeys.holdersCount, holders.length, 'count', { sampled: holders.length >= 100 });
      s(SignalKeys.topTenConcentrationBps, top10ConcentrationBps(holders), 'bps');
      s(SignalKeys.transfers30d, transfers.length, 'count', { sampled: transfers.length >= 500 });
      s(SignalKeys.uniqueSenders30d, uniqueSenders(transfers), 'count');
    }
    return out;
  }
}
