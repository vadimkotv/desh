import type { Agent, CreateAgent } from '@agentipo/shared';

export const AGENT_REPOSITORY = Symbol('AGENT_REPOSITORY');

// Internal view of an agent: public Agent DTO + the private wiring needed to act.
export interface AgentRecord extends Agent {
  keyIndex: number;
  circleWalletId: string | null;
}

export interface WalletProvision {
  walletAddress: string;
  circleWalletId?: string | null;
}

export interface IdentityRef {
  agentId: string;
  chainId: number;
  txHash: string;
}

export interface AgentRepository {
  create(input: CreateAgent): Promise<AgentRecord>;
  findById(id: string): Promise<AgentRecord | null>;
  findAll(): Promise<AgentRecord[]>;
  setWallet(id: string, wallet: WalletProvision): Promise<AgentRecord>;
  setHederaAccount(id: string, accountId: string): Promise<AgentRecord>;
  setIdentity(id: string, identity: IdentityRef): Promise<AgentRecord>;
}
