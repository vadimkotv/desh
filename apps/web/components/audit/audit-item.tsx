import Link from 'next/link';
import type { Agent, AuditEntry, AuditKind } from '@agentipo/shared';
import { Badge, type BadgeTone } from '@/components/ui/badge';
import { ExternalLink } from '@/components/ui/external-link';
import { JsonView } from '@/components/ui/json-view';
import { formatDate, hashscanTopicUrl, shortId } from '@/lib/format';
import { auditSummary } from './audit-summary';

const kindTone: Record<AuditKind, BadgeTone> = {
  AGENT_REGISTERED: 'agent',
  DATA_PURCHASED: 'amber',
  DECISION_MADE: 'info',
  APPROVAL_REQUESTED: 'amber',
  DECISION_APPROVED: 'accent',
  DECISION_REJECTED: 'danger',
  INVESTMENT_SUBMITTED: 'amber',
  INVESTMENT_CONFIRMED: 'accent',
  INVESTMENT_FAILED: 'danger',
  ROUND_FINALIZED: 'info',
  MILESTONE_RELEASED: 'accent',
  EXIT_SETTLED: 'accent',
  RETURN_CLAIMED: 'accent',
};

const dotTone: Record<AuditKind, string> = {
  AGENT_REGISTERED: 'bg-agent',
  DATA_PURCHASED: 'bg-amber',
  DECISION_MADE: 'bg-info',
  APPROVAL_REQUESTED: 'bg-amber',
  DECISION_APPROVED: 'bg-accent',
  DECISION_REJECTED: 'bg-danger',
  INVESTMENT_SUBMITTED: 'bg-amber',
  INVESTMENT_CONFIRMED: 'bg-accent',
  INVESTMENT_FAILED: 'bg-danger',
  ROUND_FINALIZED: 'bg-info',
  MILESTONE_RELEASED: 'bg-accent',
  EXIT_SETTLED: 'bg-accent',
  RETURN_CLAIMED: 'bg-accent',
};

type AuditItemProps = { entry: AuditEntry; agents: Map<string, Agent> };

export function AuditItem({ entry, agents }: AuditItemProps) {
  const anchored = entry.hcsTopicId !== null && entry.hcsSequenceNumber !== null;
  const agent = entry.agentId ? agents.get(entry.agentId) : undefined;
  return (
    <li className="relative pl-5">
      <span className={`absolute -left-[5px] top-3 h-2.5 w-2.5 rounded-full border-2 border-ink ${dotTone[entry.kind] ?? 'bg-line-strong'}`} aria-hidden />
      <article className="grid gap-2 rounded-lg border border-line bg-panel/90 px-3 py-2.5 transition-colors hover:border-line-strong md:grid-cols-[150px_1fr_auto] md:items-start">
        <div className="flex flex-col gap-1">
          <span className="num text-[10.5px] text-dim">{formatDate(entry.createdAt)}</span>
          <Badge tone={kindTone[entry.kind] ?? 'neutral'} className="w-fit">{entry.kind.replace('_', ' ')}</Badge>
        </div>
        <div className="min-w-0">
          <p className="text-[12.5px] text-fg">
            {entry.agentId ? (
              <Link href={`/agents/${entry.agentId}`} className="font-semibold text-agent hover:underline">{agent?.name ?? `agent ${shortId(entry.agentId)}`}</Link>
            ) : (
              <span className="font-mono text-muted">system</span>
            )}
            <span className="text-muted"> · {auditSummary(entry)}</span>
          </p>
          <div className="mt-1">
            <JsonView value={entry.payload} />
          </div>
        </div>
        <div className="flex flex-col items-start gap-1 font-mono text-[10.5px] md:items-end">
          {anchored ? (
            <>
              <Badge tone="accent"><span className="live-dot">●</span> anchored</Badge>
              <ExternalLink href={hashscanTopicUrl(entry.hcsTopicId as string)}>topic {entry.hcsTopicId}</ExternalLink>
              <span className="text-muted">seq #{entry.hcsSequenceNumber}</span>
            </>
          ) : (
            <>
              <Badge tone="neutral">local only</Badge>
              <span className="text-dim">not mirrored to HCS</span>
            </>
          )}
        </div>
      </article>
    </li>
  );
}
