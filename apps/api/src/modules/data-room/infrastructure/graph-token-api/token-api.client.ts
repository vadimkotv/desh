import { Injectable } from '@nestjs/common';
import { GRAPH } from '@agentipo/shared';
import { AppConfig } from '../../../../config/app-config';
import { getJson } from '../../../../common/http/json-http';

export interface TokenHolder { address: string; amount: string; decimals: number; symbol: string }
export interface TokenTransfer { from: string; to: string; value?: string; amount?: string; timestamp: number }
export interface TokenBalance { contract: string; amount: string; decimals: number; symbol: string }

interface Paged<T> { data: T[] }

// The Graph Token API (REST, powered by Substreams). Auth: JWT from thegraph.market.
@Injectable()
export class TokenApiClient {
  constructor(private readonly config: AppConfig) {}

  get enabled(): boolean {
    return this.config.features.graphTokenApi;
  }

  holders(contract: string, network: string, limit = 100): Promise<TokenHolder[]> {
    return this.get<TokenHolder>(`/holders/evm/${contract}`, { network_id: network, limit, order_by: 'desc' });
  }

  transfers(contract: string, network: string, ageDays = 30, limit = 500): Promise<TokenTransfer[]> {
    return this.get<TokenTransfer>('/transfers/evm', { contract, network_id: network, age: ageDays, limit });
  }

  balances(address: string, network: string): Promise<TokenBalance[]> {
    return this.get<TokenBalance>(`/balances/evm/${address}`, { network_id: network, limit: 100 });
  }

  private async get<T>(path: string, params: Record<string, string | number>): Promise<T[]> {
    const url = new URL(`${GRAPH.tokenApiBase}${path}`);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
    const res = await getJson<Paged<T>>(url.toString(), {
      headers: { authorization: `Bearer ${this.config.env.GRAPH_TOKEN_API_JWT}` },
    });
    return res.data ?? [];
  }
}
