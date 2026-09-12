import type { StartupLink } from '@agentipo/shared';

export interface DemoStartup {
  name: string;
  targetUsdc: number;
  equityBps: number;
  milestones: { title: string; releaseBps: number }[];
  startup: {
    name: string;
    description: string;
    sector: string;
    website?: string;
    founderAddress: string;
    treasuryAddress: string;
    tokenAddress?: string;
    tokenNetwork: string;
    githubRepo?: string;
    links: StartupLink[];
  };
}

const milestones = [
  { title: 'Mainnet launch', releaseBps: 4_000 },
  { title: '10k monthly active wallets', releaseBps: 3_000 },
  { title: 'Audit + v2 release', releaseBps: 3_000 },
];

// Token/treasury addresses are real mainnet contracts so live Graph data flows.
export const DEMO_STARTUPS: DemoStartup[] = [
  {
    name: 'Meridian Yield',
    targetUsdc: 5_000,
    equityBps: 800,
    milestones,
    startup: {
      name: 'Meridian Yield',
      description: 'Demo startup: on-chain yield router for stablecoin treasuries. Data room indexes the GRT token as a stand-in.',
      sector: 'defi',
      website: 'https://example.com/meridian',
      founderAddress: '0x1111111111111111111111111111111111111111',
      treasuryAddress: '0x28C6c06298d514Db089934071355E5743bf21d60',
      tokenAddress: '0xc944e90c64b2c07662a292be6244bdf05cda44a7',
      tokenNetwork: 'mainnet',
      githubRepo: 'graphprotocol/graph-node',
      links: [
        { kind: 'website', url: 'https://example.com/meridian' },
        { kind: 'twitter', url: 'https://x.com/meridianyield' },
        { kind: 'github', url: 'https://github.com/graphprotocol/graph-node' },
        { kind: 'docs', url: 'https://example.com/meridian/docs' },
      ],
    },
  },
  {
    name: 'Orbital Agents',
    targetUsdc: 2_500,
    equityBps: 1_200,
    milestones,
    startup: {
      name: 'Orbital Agents',
      description: 'Demo startup: marketplace for ERC-8004 registered agents. Data room indexes the AAVE token as a stand-in.',
      sector: 'ai',
      founderAddress: '0x2222222222222222222222222222222222222222',
      treasuryAddress: '0x25F2226B597E8F9514B3F68F00f494cF4f286491',
      tokenAddress: '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9',
      tokenNetwork: 'mainnet',
      links: [
        { kind: 'website', url: 'https://example.com/orbital' },
        { kind: 'twitter', url: 'https://x.com/orbitalagents' },
        { kind: 'discord', url: 'https://discord.gg/orbital' },
        { kind: 'explorer', url: 'https://etherscan.io/token/0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9' },
      ],
    },
  },
  {
    name: 'Ledgerline Payroll',
    targetUsdc: 1_000,
    equityBps: 500,
    milestones: [{ title: 'Pilot with 5 companies', releaseBps: 10_000 }],
    startup: {
      name: 'Ledgerline Payroll',
      description: 'Demo startup: stablecoin payroll on Arc. Pre-token, treasury only.',
      sector: 'fintech',
      founderAddress: '0x3333333333333333333333333333333333333333',
      treasuryAddress: '0xF977814e90dA44bFA03b6295A0616a897441aceC',
      tokenNetwork: 'mainnet',
      links: [
        { kind: 'website', url: 'https://example.com/ledgerline' },
        { kind: 'linkedin', url: 'https://www.linkedin.com/company/ledgerline' },
      ],
    },
  },
];
