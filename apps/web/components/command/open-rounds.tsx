import { EmptyState } from '@/components/ui/empty-state';
import { SectionLabel } from '@/components/ui/panel';
import type { RoundDetail } from '@/lib/types';
import { RoundRow } from './round-row';

type OpenRoundsProps = { rounds: RoundDetail[]; scores: Map<string, number | null> };

export function OpenRounds({ rounds, scores }: OpenRoundsProps) {
  return (
    <div className="flex flex-col">
      <SectionLabel right={`${rounds.length} accepting capital`}>Open rounds</SectionLabel>
      {rounds.length === 0 ? (
        <EmptyState title="No open rounds" hint="Create a startup and a round through POST /startups and POST /rounds." />
      ) : (
        <div className="flex flex-col gap-2">
          {rounds.map((round) => (
            <RoundRow key={round.id} round={round} score={scores.get(round.id) ?? null} />
          ))}
        </div>
      )}
    </div>
  );
}
