import type { AgentMode, Mandate } from '@agentipo/shared';

export interface DemoAgent {
  name: string;
  ownerAddress: string;
  mode?: AgentMode;
  mandate: Mandate;
}

// Three mandates that deliberately disagree on the same round — the "swarm" demo —
// plus one advisory agent that researches identically but waits for a human.
export const DEMO_AGENTS: DemoAgent[] = [
  {
    name: 'Sentinel (conservative)',
    ownerAddress: '0xA1A1A1A1A1A1A1A1A1A1A1A1A1A1A1A1A1A1A1A1',
    mandate: {
      thesis: 'Capital preservation first. Only back rounds with deep liquidity, stable treasuries and proven founders.',
      sectors: ['defi', 'fintech'],
      minScore: 75,
      maxTicketUsdc: 100,
      maxPerRoundShareBps: 3_000,
      dailyBudgetUsdc: 200,
      maxDataSpendUsdc: 0.5,
      riskTolerance: 'conservative',
    },
  },
  {
    name: 'Meridian (balanced)',
    ownerAddress: '0xB2B2B2B2B2B2B2B2B2B2B2B2B2B2B2B2B2B2B2B2',
    mandate: {
      thesis: 'Back on-chain businesses with real usage and a credible path to revenue; size tickets to conviction.',
      sectors: ['defi', 'ai', 'fintech'],
      minScore: 60,
      maxTicketUsdc: 250,
      maxPerRoundShareBps: 4_000,
      dailyBudgetUsdc: 600,
      maxDataSpendUsdc: 1,
      riskTolerance: 'balanced',
    },
  },
  {
    name: 'Vanguard (aggressive)',
    ownerAddress: '0xC3C3C3C3C3C3C3C3C3C3C3C3C3C3C3C3C3C3C3C3',
    mandate: {
      thesis: 'Early, contrarian, high-variance: agent economies and new primitives. Accept thin data for asymmetric upside.',
      sectors: ['ai', 'defi'],
      minScore: 45,
      maxTicketUsdc: 400,
      maxPerRoundShareBps: 5_000,
      dailyBudgetUsdc: 1_000,
      maxDataSpendUsdc: 2,
      riskTolerance: 'aggressive',
    },
  },
  {
    name: 'Atlas (human-in-the-loop)',
    ownerAddress: '0xD4D4D4D4D4D4D4D4D4D4D4D4D4D4D4D4D4D4D4D4',
    mode: 'ADVISORY',
    mandate: {
      thesis: 'Do the full diligence autonomously, then hand a sized, argued ticket to a human. Never move capital alone.',
      sectors: ['defi', 'ai', 'fintech'],
      minScore: 55,
      maxTicketUsdc: 300,
      maxPerRoundShareBps: 4_000,
      dailyBudgetUsdc: 800,
      maxDataSpendUsdc: 1,
      riskTolerance: 'balanced',
    },
  },
];
