import type { Decision } from '@agentipo/shared';
import { EmptyState } from '@/components/ui/empty-state';
import { DecisionCard } from './decision-card';

type DecisionFeedProps = { decisions: Decision[]; title?: string };

export function DecisionFeed({ decisions, title = 'Decisions' }: DecisionFeedProps) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-mono text-[11px] uppercase tracking-[0.25em] text-muted">{title}</h2>
        <span className="font-mono text-[11px] text-muted">{decisions.length} total</span>
      </div>
      {decisions.length === 0 ? (
        <EmptyState title="No decisions yet" hint="Run the agent to evaluate every open round in its mandate." />
      ) : (
        <div className="flex flex-col gap-3">
          {decisions.map((decision) => (
            <DecisionCard key={decision.id} decision={decision} />
          ))}
        </div>
      )}
    </section>
  );
}
