import type { DueDiligencePreview } from '@agentipo/shared';
import { EmptyState } from '@/components/ui/empty-state';
import type { RoundDetail } from '@/lib/types';
import { RoundCard } from './round-card';

type RoundGridProps = {
  rounds: RoundDetail[];
  previews: Map<string, DueDiligencePreview | null>;
};

export function RoundGrid({ rounds, previews }: RoundGridProps) {
  if (rounds.length === 0) {
    return (
      <EmptyState
        title="No open rounds"
        hint="Create a startup and a round through POST /startups and POST /rounds."
      />
    );
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {rounds.map((round) => (
        <RoundCard key={round.id} round={round} preview={previews.get(round.id) ?? null} />
      ))}
    </div>
  );
}
