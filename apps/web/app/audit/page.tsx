import { AuditTimeline } from '@/components/audit/audit-timeline';
import { Ring } from '@/components/charts/ring';
import { StatTile } from '@/components/charts/stat-tile';
import { ApiOffline } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { api, listOrEmpty } from '@/lib/api';
import { num, percent } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function AuditPage() {
  const [auditResult, agentsResult] = await Promise.all([api.audit(), api.agents()]);
  const audit = listOrEmpty(auditResult);
  const agents = listOrEmpty(agentsResult).items;
  const anchored = audit.items.filter((entry) => entry.hcsSequenceNumber !== null).length;
  const kinds = new Set(audit.items.map((e) => e.kind)).size;
  return (
    <>
      <PageHeader
        eyebrow="hedera consensus service"
        title="Audit log"
        description="Every consequential agent action, mirrored to an HCS topic so anyone can verify why an agent invested without trusting our database."
      />
      {audit.offline ? (
        <ApiOffline />
      ) : (
        <div className="flex flex-col gap-4">
          <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-4">
            <StatTile label="Entries" value={num(audit.items.length)} hint={`${kinds} kinds`} />
            <StatTile
              label="Anchored to HCS"
              value={`${num(anchored)} / ${num(audit.items.length)}`}
              hint={anchored === 0 ? 'HCS off · local only' : 'sequence numbers on Hedera'}
              tone={anchored > 0 ? 'accent' : 'amber'}
              viz={<Ring value={percent(anchored, audit.items.length)} size={44} stroke={5} color="var(--color-chart-agent)" showValue={false} />}
            />
            <StatTile label="Agents seen" value={num(new Set(audit.items.map((e) => e.agentId).filter(Boolean)).size)} tone="agent" />
            <StatTile label="Failures" value={num(audit.items.filter((e) => e.kind === 'INVESTMENT_FAILED').length)} hint="settlement failed" />
          </div>
          <AuditTimeline entries={audit.items} agents={agents} />
        </div>
      )}
    </>
  );
}
