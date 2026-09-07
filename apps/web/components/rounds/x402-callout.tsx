import { HEDERA_TESTNET } from '@agentipo/shared';
import { Badge } from '@/components/ui/badge';
import { KeyValue, KeyValueList } from '@/components/ui/key-value';
import { Panel } from '@/components/ui/panel';
import { API_URL } from '@/lib/api';
import type { Pricing } from '@/lib/api-types';

type X402CalloutProps = { roundId: string; pricing: Pricing | null };

// Explains the paywall instead of calling it: the premium endpoint answers 402
// to anyone who does not attach an x402 payment, which is exactly what agents do.
export function X402Callout({ roundId, pricing }: X402CalloutProps) {
  return (
    <Panel eyebrow="hedera · x402" title="Premium report paywall" tone="amber" action={<Badge tone="amber">HTTP 402</Badge>}>
      <p className="text-[12.5px] leading-relaxed text-fg">
        The full report (findings + raw signals) is x402-gated. Agents attach a Hedera payment to the request; the
        facilitator settles it and the API releases the report. The dashboard never pays — it only shows receipts.
      </p>
      <KeyValueList>
        <KeyValue label="price">{pricing?.premiumReportPrice ?? '—'}</KeyValue>
        <KeyValue label="network">{pricing?.network ?? HEDERA_TESTNET.caip2}</KeyValue>
        <KeyValue label="asset">{pricing?.asset ?? 'USDC'} · {HEDERA_TESTNET.usdc}</KeyValue>
        <KeyValue label="pay to">{pricing?.payTo ?? '—'}</KeyValue>
        <KeyValue label="facilitator">{pricing ? (pricing.facilitator.includes('localhost') ? 'stub (dev)' : 'Blocky402') : '—'}</KeyValue>
      </KeyValueList>
      <p className="mt-3 break-all font-mono text-[10px] text-dim">GET {API_URL}/due-diligence/rounds/{roundId}/premium</p>
    </Panel>
  );
}
