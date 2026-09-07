import { ARC_TESTNET } from '@agentipo/shared';
import { defineChain } from 'viem';

// Arc testnet: EVM L1 by Circle where USDC is the native gas token (18 dp natively,
// 6 dp through the ERC-20 interface at 0x3600...0000).
export const arcTestnet = (rpcUrl: string = ARC_TESTNET.rpcUrl) =>
  defineChain({
    id: ARC_TESTNET.id,
    name: ARC_TESTNET.name,
    nativeCurrency: { name: 'USD Coin', symbol: 'USDC', decimals: 18 },
    rpcUrls: { default: { http: [rpcUrl] } },
    blockExplorers: { default: { name: 'Arcscan', url: ARC_TESTNET.explorer } },
    testnet: true,
  });
