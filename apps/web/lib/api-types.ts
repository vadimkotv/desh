import type { Investment, Round, Startup } from '@agentipo/shared';

// Response shapes of endpoints that the shared package does not model.
// The API's GET /rounds and GET /rounds/:id embed the startup and investments.
export type RoundDetail = Round & { startup: Startup; investments: Investment[] };

export type FeatureFlags = {
  graphTokenApi: boolean;
  graphGateway: boolean;
  messariDex: boolean;
  arcEscrow: boolean;
  circleWallets: boolean;
  hedera: boolean;
  x402: boolean;
  hcs: boolean;
  agentKeys: boolean;
  llm: boolean;
};
export type Health = { ok: boolean; features: FeatureFlags; time?: string };

export type DdHistoryPoint = { id: string; score: number; dataCoverage: number; createdAt: string };

export type Receipt = {
  id: string;
  agentId: string;
  resource: string;
  network: string;
  asset: string;
  amount: string; // atomic units, USDC 6dp
  payer: string;
  txId: string;
  success: boolean;
  createdAt: string;
};

export type Pricing = {
  enabled: boolean;
  network: string;
  facilitator: string;
  payTo: string;
  asset: string;
  premiumReportPrice: string;
};

export type WalletBalance = { address: string; usdc: number };

export type OnchainRound = {
  onchainRoundId: number;
  escrowAddress: string;
  founder: string;
  targetUsdc: number;
  raisedUsdc: number;
  deadline: string;
  status: string;
  releasedCount: number;
  investorCount: number;
  milestoneBps: number[];
  returnCapBps?: number;
  capUsdc?: number;
  distributedUsdc?: number;
};

export type ClaimResult = { agentId: string; roundId: string; claimedUsdc: number; txHash: string | null; chainId: number };

export type RunHandle = { runId: string };
export type SwarmRun = { agentId: string; agentName: string; runId: string };
export type SwarmResponse = { runs: SwarmRun[] };

export type ApiResult<T> = { ok: true; data: T } | { ok: false; status: number; error: string };
