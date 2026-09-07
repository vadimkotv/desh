// Chain constants shared by API, web and scripts. Single source of truth.
export const ARC_TESTNET = {
  id: 5042002,
  name: 'Arc Testnet',
  rpcUrl: 'https://rpc.testnet.arc.io',
  explorer: 'https://testnet.arcscan.app',
  usdc: '0x3600000000000000000000000000000000000000',
  usdcDecimals: 6,
} as const;

export const HEDERA_TESTNET = {
  caip2: 'hedera:testnet',
  mirrorNode: 'https://testnet.mirrornode.hedera.com',
  explorer: 'https://hashscan.io/testnet',
  usdc: '0.0.429274',
  hbar: '0.0.0',
  usdcDecimals: 6,
} as const;

export const ERC8004_SEPOLIA = {
  chainId: 11155111,
  identityRegistry: '0x8004A818BFB912233c491871b3d84c89A494BD9e',
  reputationRegistry: '0x8004B663056A597Dffe9eCcC1965A193B7388713',
  agent0SubgraphId: '6wQRC7geo9XYAhckfmfo8kbMRLeWU8KQd3XsJqFKmZLT',
} as const;

export const ERC8004_BASE_SEPOLIA = {
  chainId: 84532,
  identityRegistry: '0x8004A818BFB912233c491871b3d84c89A494BD9e',
  reputationRegistry: '0x8004B663056A597Dffe9eCcC1965A193B7388713',
  agent0SubgraphId: '4yYAvQLFjBhBtdRCY7eUWo181VNoTSLLFd5M7FXQAi6u',
} as const;

export const GRAPH = {
  tokenApiBase: 'https://token-api.thegraph.com',
  gatewayBase: 'https://gateway.thegraph.com/api',
} as const;

export const explorerTx = (chainId: number, hash: string): string =>
  chainId === ARC_TESTNET.id ? `${ARC_TESTNET.explorer}/tx/${hash}` : `https://sepolia.etherscan.io/tx/${hash}`;

export const hashscanTx = (txId: string): string => `${HEDERA_TESTNET.explorer}/transaction/${txId}`;
