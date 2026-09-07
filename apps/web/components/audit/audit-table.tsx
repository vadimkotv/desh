import type { AuditEntry } from '@agentipo/shared';
import { EmptyState } from '@/components/ui/empty-state';
import { AuditRow } from './audit-row';

export function AuditTable({ entries }: { entries: AuditEntry[] }) {
  if (entries.length === 0) {
    return <EmptyState title="Audit log is empty" hint="Entries appear as agents register, buy data, decide and invest." />;
  }
  return (
    <div className="overflow-x-auto rounded-lg border border-line bg-panel/90">
      <table className="w-full min-w-[720px] text-left">
        <thead className="border-b border-line font-mono text-[10px] uppercase tracking-wider text-muted">
          <tr>
            <th className="px-4 py-2.5 font-normal">time</th>
            <th className="py-2.5 pr-3 font-normal">kind</th>
            <th className="py-2.5 pr-3 font-normal">agent</th>
            <th className="py-2.5 pr-3 font-normal">hedera hcs</th>
            <th className="py-2.5 pr-4 font-normal">payload</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line [&>tr>td:first-child]:pl-4 [&>tr>td:last-child]:pr-4">
          {entries.map((entry) => (
            <AuditRow key={entry.id} entry={entry} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
