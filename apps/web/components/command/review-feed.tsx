import type { ReviewFeedItem } from '@agentipo/shared';
import { EmptyState } from '@/components/ui/empty-state';
import { SectionLabel } from '@/components/ui/panel';
import type { RoundDetail } from '@/lib/types';
import { RoundRow } from './round-row';

export type ReviewItem = ReviewFeedItem & { round: RoundDetail };

type ReviewFeedProps = { items: ReviewItem[]; hasRunningAgents: boolean };

export function ReviewFeed({ items, hasRunningAgents }: ReviewFeedProps) {
  return (
    <section>
      <SectionLabel right={`${items.length} in feed`}>Waiting for review</SectionLabel>
      {items.length === 0 ? (
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
          {items.map((item, index) => (
            <li key={item.roundId} className="w-[84vw] min-w-[280px] max-w-[420px] shrink-0 snap-start">
              <div className="mb-2 flex items-center gap-2" aria-hidden>
                <span className="h-2 w-2 shrink-0 rounded-full border border-agent/60 bg-agent/20" />
                {index < items.length - 1 && <span className="h-px flex-1 bg-line-strong" />}
              </div>
              <RoundRow round={item.round} score={item.score} state={item.state} watchers={item.watchers} />
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
