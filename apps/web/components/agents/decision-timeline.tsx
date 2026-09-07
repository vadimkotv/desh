import type { Decision } from '@agentipo/shared';
import { BarStrip } from '@/components/charts/bar-strip';
import { EmptyState } from '@/components/ui/empty-state';
import { SectionLabel } from '@/components/ui/panel';
import { formatDate, num } from '@/lib/format';
import { DecisionItem } from './decision-item';

type DecisionTimelineProps = { decisions: Decision[]; roundNames: Map<string, string>; roundCaps: Map<string, number> };

// Newest first; the bar strip above shows invested amounts in time order (oldest → newest).
export function DecisionTimeline({ decisions, roundNames, roundCaps }: DecisionTimelineProps) {
  const sorted = [...decisions].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const invested = [...decisions]
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map((d) => ({ label: `${formatDate(d.createdAt)} · ${roundNames.get(d.roundId) ?? d.roundId.slice(0, 8)}`, value: Math.round(d.amountUsdc), tone: d.investment?.status === 'FAILED' ? ('danger' as const) : d.action === 'INVEST' ? ('accent' as const) : ('muted' as const) }));
  const total = decisions.reduce((s, d) => s + (d.investment?.status === 'CONFIRMED' ? d.amountUsdc : 0), 0);
  return (
    <section>
      <SectionLabel right={`${decisions.length} decisions · ${num(total)} USDC confirmed`}>Decisions</SectionLabel>
      {decisions.length === 0 ? (
        <EmptyState title="No decisions yet" hint="Run the agent to evaluate every open round in its mandate." />
      ) : (
        <>
          <div className="mb-3 flex items-end gap-3 rounded-lg border border-line bg-panel/90 px-4 py-3">
            <div className="flex flex-col gap-1">
              <span className="eyebrow">invested per decision</span>
              <span className="font-mono text-[10px] text-dim">oldest → newest · USDC</span>
            </div>
            <div className="overflow-x-auto">
              <BarStrip bars={invested} height={56} />
            </div>
          </div>
          <ol className="flex flex-col gap-2 border-l border-line pl-1">
            {sorted.map((decision) => (
              <DecisionItem key={decision.id} decision={decision} roundName={roundNames.get(decision.roundId)} returnCapBps={roundCaps.get(decision.roundId)} />
            ))}
          </ol>
        </>
      )}
    </section>
  );
}
