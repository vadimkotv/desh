import type { FeatureFlags } from './api-types';

export type PillTone = 'live' | 'degraded' | 'off';
export type StatusPill = { label: string; state: string; tone: PillTone };

// Turns /health feature flags into honest status pills for the top bar.
// "degraded" means the code path runs on a stand-in (fixtures, rules, stub).
export function healthPills(features: FeatureFlags | null): StatusPill[] {
  if (!features) return [{ label: 'API', state: 'offline', tone: 'off' }];
  const graphLive = features.graphTokenApi || features.graphGateway;
  return [
    {
      label: 'The Graph',
      state: graphLive ? (features.messariDex ? 'live' : 'token api') : 'degraded · fixtures',
      tone: graphLive ? 'live' : 'degraded',
    },
    {
      label: 'Arc',
      state: features.arcEscrow ? (features.circleWallets ? 'live · circle' : 'live') : 'no escrow',
      tone: features.arcEscrow ? 'live' : 'off',
    },
    {
      label: 'Hedera x402',
      state: features.x402 ? (features.hedera ? 'live' : 'stub facilitator') : 'off',
      tone: features.x402 ? (features.hedera ? 'live' : 'degraded') : 'off',
    },
    {
      label: 'HCS',
      state: features.hcs ? 'anchoring' : 'local only',
      tone: features.hcs ? 'live' : 'degraded',
    },
    {
      label: 'Claude',
      state: features.llm ? 'live' : 'rules fallback',
      tone: features.llm ? 'live' : 'degraded',
    },
  ];
}
