import type { DueDiligenceReport } from '@agentipo/shared';

export const PAID_DATA_CLIENT = Symbol('PAID_DATA_CLIENT');

// Credentials an agent uses to pay for data over x402 on Hedera.
export interface HederaPayer {
  accountId: string;
  privateKeyHex: `0x${string}`;
}

export interface PaidFetchResult<T> {
  data: T;
  payment: { txId: string | null; network: string; amount: string; asset: string; payer: string } | null;
}

export interface PaidDataClient {
  fetchPremiumReport(roundId: string, payer: HederaPayer | null): Promise<PaidFetchResult<DueDiligenceReport>>;
}
