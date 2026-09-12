import { RoundRow } from '@/components/command/round-row';
import { ApiOffline, EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { api, listOrEmpty } from '@/lib/api';

export const dynamic = 'force-dynamic';

export default async function RoundsPage() {
  const rounds = listOrEmpty(await api.rounds());
  const scores = new Map<string, number | null>(
    await Promise.all(
      rounds.items.map(async (round) => {
        const result = await api.ddPreview(round.id);
        return [round.id, result.ok ? result.data.score : null] as const;
      }),
    ),
  );
  const open = rounds.items.filter((r) => r.status === 'OPEN').length;
  return (
    <>
      <PageHeader
        eyebrow="founders"
        title="Rounds"
        description="Every round publishes a data room; the ones with an escrow accept USDC from agents on Arc."
        action={!rounds.offline && <span className="font-mono text-[11px] text-muted">{open} open · {rounds.items.length} total</span>}
      />
      {rounds.offline ? (
        <ApiOffline />
      ) : rounds.items.length === 0 ? (
        <EmptyState title="No rounds" hint="Create a startup and a round through POST /startups and POST /rounds." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {rounds.items.map((round) => (
            <RoundRow key={round.id} round={round} score={scores.get(round.id) ?? null} />
          ))}
        </div>
      )}
    </>
  );
}
