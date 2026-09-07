import { ARC_TESTNET, explorerTx, hashscanTx } from '@agentipo/shared';

// The API reports the real chain id (5042002 on Arc); older rows from the local
// fork carry 0, which still means the Arc rail — so 0 falls back to arcscan.
export const settlementTxUrl = (chainId: number, hash: string): string =>
  explorerTx(chainId || ARC_TESTNET.id, hash);

export const hederaTxUrl = (txId: string): string => hashscanTx(txId);
