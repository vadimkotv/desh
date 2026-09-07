import { HEDERA_TESTNET } from '@agentipo/shared';
import type { RoutesConfig } from '@x402/core/server';
import type { AppConfig } from '../../../../config/app-config';

// Declarative price list for x402-gated resources. Add a line here to monetize a route.
export function premiumRoutes(config: AppConfig): RoutesConfig {
  const { env } = config;
  const payTo = env.HEDERA_PAYTO_ACCOUNT_ID as string;
  const price =
    env.X402_ASSET === 'HBAR'
      ? { asset: HEDERA_TESTNET.hbar, amount: env.X402_HBAR_TINYBARS }
      : env.X402_PREMIUM_REPORT_PRICE;

  return {
    'GET /due-diligence/rounds/*/premium': {
      accepts: { scheme: 'exact', network: config.hederaNetwork, payTo, price, maxTimeoutSeconds: 120 },
      description: 'AgentIPO premium due-diligence report (full findings + raw on-chain signals)',
      mimeType: 'application/json',
      serviceName: 'AgentIPO Data Room',
      tags: ['fundraising', 'due-diligence', 'the-graph'],
    },
  };
}
