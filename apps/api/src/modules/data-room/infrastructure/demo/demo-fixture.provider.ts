import { Injectable } from '@nestjs/common';
import { type Signal, SignalKeys } from '@agentipo/shared';
import { AppConfig } from '../../../../config/app-config';
import { type DataProvider, signal, type StartupContext } from '../../domain/data-provider.port';

// Opt-in (DEMO_SIGNALS=true) deterministic fixture so the decision + settlement pipeline
// can be exercised on a laptop without Graph credentials. Never enabled by default and
// every emitted signal is tagged with source "demo-fixture" so it can't be mistaken for
// live data. Values are derived from the startup name hash for stable variety.
@Injectable()
export class DemoFixtureProvider implements DataProvider {
  readonly source = 'demo-fixture' as const;

  constructor(private readonly config: AppConfig) {}

  supports(): boolean {
    return this.config.env.DEMO_SIGNALS === 'true';
  }

  async collect({ startup }: StartupContext): Promise<Signal[]> {
    const seed = hash(startup.name);
    const pick = (min: number, max: number, salt: number) => min + ((seed * salt) % 1000) / 1000 * (max - min);
    const meta = { fixture: true };
    return [
      signal(this.source, SignalKeys.holdersCount, Math.round(pick(300, 6_000, 7)), 'count', meta),
      signal(this.source, SignalKeys.topTenConcentrationBps, Math.round(pick(2_500, 7_500, 11)), 'bps', meta),
      signal(this.source, SignalKeys.transfers30d, Math.round(pick(200, 3_000, 13)), 'count', meta),
      signal(this.source, SignalKeys.uniqueSenders30d, Math.round(pick(50, 800, 17)), 'count', meta),
      signal(this.source, SignalKeys.treasuryStableUsd, Math.round(pick(5_000, 400_000, 19)), 'usd', meta),
      signal(this.source, SignalKeys.treasuryTokenCount, Math.round(pick(2, 12, 23)), 'count', meta),
      signal(this.source, SignalKeys.treasuryOwnTokenShareBps, Math.round(pick(1_000, 8_000, 29)), 'bps', meta),
      signal(this.source, SignalKeys.dexLiquidityUsd, Math.round(pick(20_000, 3_000_000, 31)), 'usd', meta),
      signal(this.source, SignalKeys.dexVolume24hUsd, Math.round(pick(1_000, 500_000, 37)), 'usd', meta),
      signal(this.source, SignalKeys.founderAgentReputation, Math.round(pick(40, 95, 41)), 'score', meta),
      signal(this.source, SignalKeys.founderAgentFeedbackCount, Math.round(pick(0, 60, 43)), 'count', meta),
    ];
  }
}

function hash(text: string): number {
  let h = 2166136261;
  for (const ch of text) h = (h ^ ch.charCodeAt(0)) * 16777619 >>> 0;
  return h % 100_000;
}
