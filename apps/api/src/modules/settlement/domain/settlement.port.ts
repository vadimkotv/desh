import type { WalletKind } from '@agentipo/shared';

export const SETTLEMENT_RAIL = Symbol('SETTLEMENT_RAIL');

// Reference to an agent-controlled wallet. keyIndex derives the local key (HD path),
// circleWalletId points at a Circle developer-controlled wallet on ARC-TESTNET.
export interface AgentWalletRef {
  kind: WalletKind;
  address: string;
  keyIndex: number;
  circleWalletId?: string | null;
}

export interface InvestParams {
  wallet: AgentWalletRef;
  onchainRoundId: number;
  amountUsdc: number;
}

export interface TxSubmission {
  txHash: string;
  chainId: number;
}

export interface SettlementRail {
  readonly kind: WalletKind;
  invest(params: InvestParams): Promise<TxSubmission>;
  waitForConfirmation(txHash: string): Promise<boolean>;
}
