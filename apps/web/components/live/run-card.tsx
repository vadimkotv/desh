import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { formatTime, shortId } from '@/lib/format';
import type { RunView } from '@/lib/run-state';
import { DecisionBlock } from './decision-block';
import { EventLog } from './event-log';
import { Stepper } from './stepper';

type RunCardProps = { run: RunView; agentName?: string; highlight?: boolean; dense?: boolean };

const statusBadge = {
  running: { tone: 'agent' as const, text: 'running' },
  completed: { tone: 'accent' as const, text: 'completed' },
  failed: { tone: 'danger' as const, text: 'failed' },
};

// One agent run: header (agent, startup), stepper, decision block, event log.
export function RunCard({ run, agentName, highlight = false, dense = false }: RunCardProps) {
  const status = statusBadge[run.status];
  const name = run.agentName ?? agentName ?? `agent ${shortId(run.agentId)}`;
  return (
    <article
      className={`rise-in flex flex-col gap-3 rounded-lg border bg-panel/95 p-3 transition-colors duration-500 ${
        run.status === 'running' ? 'border-agent/50 shadow-[0_0_24px_-12px_rgba(169,156,255,0.6)]' : highlight ? 'border-accent/40' : 'border-line'
      }`}
    >
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <Link href={`/agents/${run.agentId}`} className="truncate text-[13px] font-semibold text-bright hover:text-agent">
            {name}
          </Link>
          <span className="text-dim">→</span>
          {run.roundId ? (
            <Link href={`/rounds/${run.roundId}`} className="truncate font-mono text-[11px] text-info hover:underline">
              {run.startup ?? `round ${shortId(run.roundId)}`}
            </Link>
          ) : (
            <span className="font-mono text-[11px] text-muted">scanning open rounds…</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="num text-[10px] text-dim">{formatTime(run.startedAt).slice(0, 8)}</span>
          <Badge tone={status.tone}>
            {run.status === 'running' && <span className="live-dot">●</span>}
            {status.text}
          </Badge>
        </div>
      </header>
      <Stepper steps={run.steps} short={dense} />
      {run.decision && <DecisionBlock decision={run.decision} />}
      <EventLog events={run.events} limit={run.status === 'running' ? 6 : 4} />
    </article>
  );
}
