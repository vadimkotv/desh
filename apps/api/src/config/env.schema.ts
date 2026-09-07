import { z } from 'zod';

const optionalStr = z.string().min(1).optional();
const hex = z.string().regex(/^0x[0-9a-fA-F]+$/);

// Every external dependency is optional so the API boots in "degraded" mode:
// providers whose credentials are missing are simply not registered.
export const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  API_PUBLIC_URL: z.string().url().default('http://localhost:4000'),
  DATABASE_URL: z.string().url(),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),

  DEMO_SIGNALS: z.enum(['true', 'false']).default('false'),

  // The Graph
  GRAPH_TOKEN_API_JWT: optionalStr,
  GRAPH_GATEWAY_API_KEY: optionalStr,
  GRAPH_MESSARI_DEX_SUBGRAPH_ID: optionalStr,
  GRAPH_AGENT0_SUBGRAPH_ID: z.string().default('6wQRC7geo9XYAhckfmfo8kbMRLeWU8KQd3XsJqFKmZLT'),

  // Arc (Circle)
  ARC_RPC_URL: z.string().url().default('https://rpc.testnet.arc.io'),
  ARC_ESCROW_ADDRESS: hex.optional(),
  ARC_PLATFORM_PRIVATE_KEY: hex.optional(),
  CIRCLE_API_KEY: optionalStr,
  CIRCLE_ENTITY_SECRET: optionalStr,
  CIRCLE_WALLET_SET_ID: optionalStr,

  // Hedera + x402
  HEDERA_NETWORK: z.enum(['testnet', 'mainnet']).default('testnet'),
  HEDERA_OPERATOR_ID: optionalStr,
  HEDERA_OPERATOR_KEY: optionalStr,
  HEDERA_PAYTO_ACCOUNT_ID: optionalStr,
  HEDERA_HCS_TOPIC_ID: optionalStr,
  X402_FACILITATOR_URL: z.string().url().default('https://api.testnet.blocky402.com'),
  X402_PREMIUM_REPORT_PRICE: z.string().default('$0.01'),
  X402_ASSET: z.enum(['USDC', 'HBAR']).default('USDC'),
  X402_HBAR_TINYBARS: z.string().regex(/^\d+$/).default('10000000'),

  // Agents
  AGENT_MASTER_MNEMONIC: optionalStr,
  AGENT_HEDERA_INITIAL_HBAR: z.coerce.number().nonnegative().default(5),
  AGENT_HEDERA_INITIAL_USDC: z.coerce.number().nonnegative().default(0.5),
  ERC8004_RPC_URL: z.string().url().default('https://ethereum-sepolia-rpc.publicnode.com'),
  ERC8004_CHAIN_ID: z.coerce.number().default(11155111),
  ERC8004_IDENTITY_REGISTRY: hex.default('0x8004A818BFB912233c491871b3d84c89A494BD9e'),
  ANTHROPIC_API_KEY: optionalStr,
  ANTHROPIC_MODEL: z.string().default('claude-sonnet-4-5'),
  DECISION_ENGINE: z.enum(['llm', 'rules', 'auto']).default('auto'),
});

export type Env = z.infer<typeof EnvSchema>;
