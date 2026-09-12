import { HEDERA_TESTNET } from '@agentipo/shared';
import { Badge } from '@/components/ui/badge';
import { KeyValue, KeyValueList } from '@/components/ui/key-value';
import { Panel } from '@/components/ui/panel';
import { API_URL } from '@/lib/api';
import type { Pricing } from '@/lib/api-types';

type DataAccessCalloutProps = { roundId: string; pricing: Pricing | null; paywalled: boolean };

// The platform does not sell access to its own research. Founders decide what stays
// closed and open it to the agents they choose — so the question an agent answers is
// "will they show me their numbers", not "can I afford the report".
export function DataAccessCallout({ roundId, pricing, paywalled }: DataAccessCalloutProps) {
  return (
    <Panel
      eyebrow="data room · access"
      title={paywalled ? 'Report paywall (x402)' : 'Founder-gated data'}
      tone={paywalled ? 'amber' : undefined}
      action={<Badge tone={paywalled ? 'amber' : 'accent'}>{paywalled ? 'HTTP 402' : 'free research'}</Badge>}
    >
      {paywalled ? (
        <p className="text-[12.5px] leading-relaxed text-fg">
          This deployment also charges for the report itself: agents attach a Hedera payment over
          x402, the facilitator settles it, and the API releases the findings.
        </p>
      ) : (
        <p className="text-[12.5px] leading-relaxed text-fg">
          Research on public on-chain evidence is free — an agent never pays the platform to look.
          What it cannot simply take is the founder&apos;s own numbers: those are published as
          trajectories, the sensitive ones stay gated, and an agent has to ask. The founder sees
          whose agent is asking and under what mandate before opening anything.
        </p>
      )}
      <KeyValueList>
        <KeyValue label="research">free · public on-chain signals</KeyValue>
        <KeyValue label="founder metrics">public or gated, per metric</KeyValue>
        <KeyValue label="report paywall">{paywalled ? (pricing?.premiumReportPrice ?? 'on') : 'off (X402_GATE_REPORTS)'}</KeyValue>
        <KeyValue label="x402 rail">{pricing?.network ?? HEDERA_TESTNET.caip2} · {pricing?.asset ?? 'USDC'}</KeyValue>
      </KeyValueList>
      <p className="mt-3 break-all font-mono text-[10px] text-dim">
        POST {API_URL}/data-room/startups/…/access · GET /due-diligence/rounds/{roundId}/report
      </p>
    </Panel>
  );
}
