import type { DueDiligencePreview } from '@agentipo/shared';
import { EmptyState } from '@/components/ui/empty-state';
import { SectionLabel } from '@/components/ui/panel';
import type { ReviewState } from '@/lib/review-rounds';
import type { RoundDetail } from '@/lib/types';
import { RoundRow } from './round-row';

type ReviewFeedProps = {
  rounds: RoundDetail[];
  previews: Map<string, DueDiligencePreview | null>;
  states: Map<string, ReviewState>;
  hasRunningAgents: boolean;
};

export function ReviewFeed({ rounds, previews, states, hasRunningAgents }: ReviewFeedProps) {
  return (
    <section>
      <SectionLabel right={`${rounds.length} in feed`}>Waiting for review</SectionLabel>
      {rounds.length === 0 ? (
        <EmptyState
          title={hasRunningAgents ? 'No matching rounds' : 'No agent is running'}
          hint={
            hasRunningAgents
              ? 'New rounds that match an active mandate will appear here automatically.'
              : 'Run an agent to watch for startups that match its mandate.'
          }
        />
      ) : (
        <ol className="flex snap-x gap-3 overflow-x-auto pb-2">
          {rounds.map((round, index) => (
            <li key={round.id} className="w-[84vw] min-w-[280px] max-w-[420px] shrink-0 snap-start">
              <div className="mb-2 flex items-center gap-2" aria-hidden>
                <span className="h-2 w-2 shrink-0 rounded-full border border-agent/60 bg-agent/20" />
                {index < rounds.length - 1 && <span className="h-px flex-1 bg-line-strong" />}
              </div>
              <RoundRow
                round={round}
                preview={previews.get(round.id) ?? null}
                state={states.get(round.id) ?? 'WAITING'}
              />
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
