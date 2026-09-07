import Link from 'next/link';
import type { AuditEntry, AuditKind } from '@agentipo/shared';
import { Badge, type BadgeTone } from '@/components/ui/badge';
import { ExternalLink } from '@/components/ui/external-link';
import { JsonView } from '@/components/ui/json-view';
import { formatDate, hashscanTopicUrl, shortId } from '@/lib/format';

const kindTone: Record<AuditKind, BadgeTone> = {
  AGENT_REGISTERED: 'info',
  DATA_PURCHASED: 'amber',
  DECISION_MADE: 'info',
  INVESTMENT_SUBMITTED: 'amber',
  INVESTMENT_CONFIRMED: 'accent',
  INVESTMENT_FAILED: 'danger',
};

export function AuditRow({ entry }: { entry: AuditEntry }) {
  return (
    <tr className="align-top">
      <td className="py-2.5 pr-3 font-mono text-[11px] text-muted whitespace-nowrap">{formatDate(entry.createdAt)}</td>
      <td className="py-2.5 pr-3"><Badge tone={kindTone[entry.kind] ?? 'neutral'}>{entry.kind}</Badge></td>
      <td className="py-2.5 pr-3 font-mono text-xs">
        {entry.agentId ? (
          <Link href={`/agents/${entry.agentId}`} className="text-info hover:underline">{shortId(entry.agentId)}</Link>
        ) : (
          <span className="text-muted">system</span>
        )}
      </td>
      <td className="py-2.5 pr-3 font-mono text-xs">
        {entry.hcsTopicId ? (
          <span className="flex flex-col gap-0.5">
            <ExternalLink href={hashscanTopicUrl(entry.hcsTopicId)}>{entry.hcsTopicId}</ExternalLink>
            <span className="text-muted">seq #{entry.hcsSequenceNumber ?? '—'}</span>
          </span>
        ) : (
          <span className="text-muted">not mirrored</span>
        )}
      </td>
      <td className="py-2.5 min-w-[200px]"><JsonView value={entry.payload} /></td>
    </tr>
  );
}
