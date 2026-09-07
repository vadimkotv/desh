import { Injectable } from '@nestjs/common';
import { GRAPH } from '@agentipo/shared';
import { AppConfig } from '../../config/app-config';
import { postJson } from '../http/json-http';

interface GraphQLResponse<T> {
  data?: T;
  errors?: { message: string }[];
}

// Shared GraphQL transport for every subgraph we read through The Graph Network gateway
// (Messari standardized subgraphs, Agent0/ERC-8004 subgraphs, ...).
@Injectable()
export class GraphGatewayClient {
  constructor(private readonly config: AppConfig) {}

  get enabled(): boolean {
    return this.config.features.graphGateway;
  }

  async query<T>(subgraphId: string, query: string, variables?: Record<string, unknown>): Promise<T> {
    const key = this.config.env.GRAPH_GATEWAY_API_KEY;
    if (!key) throw new Error('GRAPH_GATEWAY_API_KEY is not configured');
    const url = `${GRAPH.gatewayBase}/${key}/subgraphs/id/${subgraphId}`;
    const res = await postJson<GraphQLResponse<T>>(url, { query, variables });
    if (res.errors?.length) throw new Error(`Subgraph error: ${res.errors.map((e) => e.message).join('; ')}`);
    if (!res.data) throw new Error('Subgraph returned no data');
    return res.data;
  }
}
