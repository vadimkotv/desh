import type { Mandate } from '@agentipo/shared';
import { Badge } from '@/components/ui/badge';
import { KeyValue, KeyValueList } from '@/components/ui/key-value';
import { Panel } from '@/components/ui/panel';
import { bpsToPercent, usdc } from '@/lib/format';

export function MandateCard({ mandate }: { mandate: Mandate }) {
  return (
    <Panel eyebrow="human intent" title="Mandate">
      <p className="text-sm leading-relaxed text-fg">{mandate.thesis}</p>
      <div className="mt-3 flex flex-wrap gap-1">
        {mandate.sectors.map((sector) => (
          <Badge key={sector} tone="info">{sector}</Badge>
        ))}
      </div>
      <div className="mt-4">
        <KeyValueList>
          <KeyValue label="min score">{mandate.minScore} / 100</KeyValue>
          <KeyValue label="max ticket">{usdc(mandate.maxTicketUsdc)}</KeyValue>
          <KeyValue label="max round share">{bpsToPercent(mandate.maxPerRoundShareBps)}</KeyValue>
          <KeyValue label="daily budget">{usdc(mandate.dailyBudgetUsdc)}</KeyValue>
          <KeyValue label="data spend cap">{usdc(mandate.maxDataSpendUsdc)}</KeyValue>
          <KeyValue label="risk">{mandate.riskTolerance}</KeyValue>
        </KeyValueList>
      </div>
    </Panel>
  );
}
