import { AuditTable } from '@/components/audit/audit-table';
import { ApiOffline } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { api, listOrEmpty } from '@/lib/api';

export const dynamic = 'force-dynamic';

export default async function AuditPage() {
  const audit = listOrEmpty(await api.audit());
  const mirrored = audit.items.filter((entry) => entry.hcsSequenceNumber !== null).length;
  return (
    <>
      <PageHeader
        eyebrow="hedera consensus service"
        title="Audit log"
        description="Every consequential agent action, mirrored to an HCS topic so anyone can verify why an agent invested without trusting our database."
        action={
          !audit.offline && (
            <span className="font-mono text-[11px] text-muted">
              {mirrored}/{audit.items.length} mirrored to HCS
            </span>
          )
        }
      />
      {audit.offline ? <ApiOffline /> : <AuditTable entries={audit.items} />}
    </>
  );
}
