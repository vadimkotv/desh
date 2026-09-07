import { Injectable } from '@nestjs/common';
import { type Signal, SignalKeys } from '@agentipo/shared';
import { AppConfig } from '../../../../config/app-config';
import { GraphGatewayClient } from '../../../../common/graph/graph-gateway.client';
import { type DataProvider, signal, type StartupContext } from '../../domain/data-provider.port';

// Graph product #2: a Messari *standardized* DEX subgraph. Because the schema is shared by
// every DEX implementation, the same query works against Uniswap, Curve, Balancer...
// Swap GRAPH_MESSARI_DEX_SUBGRAPH_ID and nothing else changes.
const POOLS_QUERY = `
  query TokenLiquidity($token: String!) {
    liquidityPools(first: 25, orderBy: totalValueLockedUSD, orderDirection: desc,
      where: { inputTokens_contains: [$token] }) {
      id
      totalValueLockedUSD
      cumulativeVolumeUSD
      dailySnapshots(first: 1, orderBy: timestamp, orderDirection: desc) { dailyVolumeUSD }
    }
  }`;

interface PoolsResult {
  liquidityPools: { id: string; totalValueLockedUSD: string; cumulativeVolumeUSD: string; dailySnapshots: { dailyVolumeUSD: string }[] }[];
}

@Injectable()
export class MessariDexProvider implements DataProvider {
  readonly source = 'graph-messari-dex' as const;

  constructor(
    private readonly gateway: GraphGatewayClient,
    private readonly config: AppConfig,
  ) {}

  supports({ startup }: StartupContext): boolean {
    return this.config.features.messariDex && Boolean(startup.tokenAddress);
  }

  async collect({ startup }: StartupContext): Promise<Signal[]> {
    const subgraphId = this.config.env.GRAPH_MESSARI_DEX_SUBGRAPH_ID as string;
    const token = (startup.tokenAddress as string).toLowerCase();
    const { liquidityPools } = await this.gateway.query<PoolsResult>(subgraphId, POOLS_QUERY, { token });

    const tvl = liquidityPools.reduce((s, p) => s + Number(p.totalValueLockedUSD), 0);
    const vol24h = liquidityPools.reduce((s, p) => s + Number(p.dailySnapshots[0]?.dailyVolumeUSD ?? 0), 0);
    const meta = { pools: liquidityPools.length, subgraphId };
    return [
      signal(this.source, SignalKeys.dexLiquidityUsd, tvl, 'usd', meta),
      signal(this.source, SignalKeys.dexVolume24hUsd, vol24h, 'usd', meta),
    ];
  }
}
