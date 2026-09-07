import type { Agent, AuditEntry } from '@agentipo/shared';
import { EmptyState } from '@/components/ui/empty-state';
import { AuditItem } from './audit-item';

type AuditTimelineProps = { entries: AuditEntry[]; agents: Agent[] };

export function AuditTimeline({ entries, agents }: AuditTimelineProps) {
  if (entries.length === 0) {
    return <EmptyState title="Audit log is empty" hint="Entries appear as agents register, buy data, decide and invest." />;
  }
  const byId = new Map(agents.map((a) => [a.id, a]));
  const sorted = [...entries].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return (
    <ol className="ml-2 flex flex-col gap-2 border-l border-line pl-1">
      {sorted.map((entry) => (
        <AuditItem key={entry.id} entry={entry} agents={byId} />
      ))}
    </ol>
  );
}
