import { Injectable } from '@nestjs/common';
import { GRAPH } from '@agentipo/shared';
import { AppConfig } from '../../../../config/app-config';
import { getJson } from '../../../../common/http/json-http';

export interface TokenHolder { address: string; amount: string; decimals: number; symbol: string }
export interface TokenTransfer { from: string; to: string; value?: string; amount?: string; timestamp: number }
export interface TokenBalance { contract: string; amount: string; decimals: number; symbol: string }

interface Paged<T> { data: T[] }

// The Graph Token API (REST v1, powered by Substreams; served by Pinax). Auth: JWT from
// thegraph.market. GRAPH_TOKEN_API_BASE overrides the host — token-api.thegraph.com is a
// CNAME to token-api.service.pinax.network, so either answers the same JWT.
@Injectable()
export class TokenApiClient {
  constructor(private readonly config: AppConfig) {}

  get enabled(): boolean {
    return this.config.features.graphTokenApi;
  }

  holders(contract: string, network: string, limit = 100): Promise<TokenHolder[]> {
    return this.get<TokenHolder>('/v1/evm/holders', { network, contract, limit });
  }

  transfers(contract: string, network: string, ageDays = 30, limit = 500): Promise<TokenTransfer[]> {
    const start_time = Math.floor(Date.now() / 1000) - ageDays * 86_400;
    return this.get<TokenTransfer>('/v1/evm/transfers', { network, contract, start_time, limit });
  }

  balances(address: string, network: string): Promise<TokenBalance[]> {
    return this.get<TokenBalance>('/v1/evm/balances', { network, address, limit: 100 });
  }

  private async get<T>(path: string, params: Record<string, string | number>): Promise<T[]> {
    const url = new URL(`${this.config.env.GRAPH_TOKEN_API_BASE ?? GRAPH.tokenApiBase}${path}`);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
    const res = await getJson<Paged<T>>(url.toString(), {
      headers: { authorization: `Bearer ${this.config.env.GRAPH_TOKEN_API_JWT}` },
    });
    return res.data ?? [];
  }
}
