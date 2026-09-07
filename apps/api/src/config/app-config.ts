import { Injectable } from '@nestjs/common';
import type { Env } from './env.schema';
import { EnvSchema } from './env.schema';

// Typed, validated view over process.env. Feature flags are derived here so the
// rest of the app asks "is X enabled" instead of poking at raw env strings.
@Injectable()
export class AppConfig {
  readonly env: Env;

  constructor(source: NodeJS.ProcessEnv = process.env) {
    // `.env` templates leave unused keys empty; treat "" as "not set".
    const cleaned = Object.fromEntries(Object.entries(source).filter(([, v]) => v !== ''));
    const parsed = EnvSchema.safeParse(cleaned);
    if (!parsed.success) {
      const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
      throw new Error(`Invalid environment:\n${issues.join('\n')}`);
    }
    this.env = parsed.data;
  }

  get features() {
    const e = this.env;
    return {
      graphTokenApi: Boolean(e.GRAPH_TOKEN_API_JWT),
      graphGateway: Boolean(e.GRAPH_GATEWAY_API_KEY),
      messariDex: Boolean(e.GRAPH_GATEWAY_API_KEY && e.GRAPH_MESSARI_DEX_SUBGRAPH_ID),
      arcEscrow: Boolean(e.ARC_ESCROW_ADDRESS && e.ARC_PLATFORM_PRIVATE_KEY),
      circleWallets: Boolean(e.CIRCLE_API_KEY && e.CIRCLE_ENTITY_SECRET && e.CIRCLE_WALLET_SET_ID),
      hedera: Boolean(e.HEDERA_OPERATOR_ID && e.HEDERA_OPERATOR_KEY),
      x402: Boolean(e.HEDERA_PAYTO_ACCOUNT_ID),
      hcs: Boolean(e.HEDERA_OPERATOR_ID && e.HEDERA_OPERATOR_KEY),
      agentKeys: Boolean(e.AGENT_MASTER_MNEMONIC),
      llm: Boolean(e.ANTHROPIC_API_KEY),
    };
  }

  get hederaNetwork(): 'hedera:testnet' | 'hedera:mainnet' {
    return this.env.HEDERA_NETWORK === 'mainnet' ? 'hedera:mainnet' : 'hedera:testnet';
  }
}
