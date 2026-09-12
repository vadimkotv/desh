import type { SignalSource } from '@agentipo/shared';
import { Badge, type BadgeTone } from '@/components/ui/badge';

type Provenance = { label: string; tone: BadgeTone; live: boolean };

const provenance: Record<SignalSource, Provenance> = {
  'graph-token-api': { label: 'LIVE · The Graph · Token API', tone: 'accent', live: true },
  'graph-messari-dex': { label: 'LIVE · The Graph · Messari DEX', tone: 'accent', live: true },
  'graph-agent0': { label: 'LIVE · The Graph · Agent0', tone: 'accent', live: true },
  'onchain-arc': { label: 'LIVE · Arc', tone: 'accent', live: true },
  'founder-metrics': { label: 'FOUNDER · disclosed', tone: 'info', live: false },
  github: { label: 'GitHub', tone: 'info', live: false },
  'demo-fixture': { label: 'FIXTURE', tone: 'amber', live: false },
};

export const provenanceOf = (source: SignalSource): Provenance =>
  provenance[source] ?? { label: source, tone: 'neutral', live: false };

// Honest data provenance: fixtures are amber, founder-supplied numbers are blue
// (self-reported, not verifiable), indexed and on-chain data is green.
export function ProvenanceBadge({ source }: { source: SignalSource }) {
  const p = provenanceOf(source);
  return (
    <Badge tone={p.tone} title={p.live ? 'observed from a live index / chain' : 'deterministic fixture — not live data'}>
      {p.live && <span className="live-dot">●</span>}
      {p.label}
    </Badge>
  );
}
