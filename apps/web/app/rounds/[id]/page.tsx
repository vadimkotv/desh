import { notFound } from 'next/navigation';
import { DdPreview } from '@/components/rounds/dd-preview';
import { InvestmentsList } from '@/components/rounds/investments-list';
import { Milestones } from '@/components/rounds/milestones';
import { OnchainPanel } from '@/components/rounds/onchain-panel';
import { PremiumCallout } from '@/components/rounds/premium-callout';
import { RoundActions } from '@/components/rounds/round-actions';
import { RoundHeader } from '@/components/rounds/round-header';
import { SignalsTable } from '@/components/rounds/signals-table';
import { ApiOffline } from '@/components/ui/empty-state';
import { api, listOrEmpty } from '@/lib/api';
import { isOffline } from '@/lib/types';

export const dynamic = 'force-dynamic';

type RoundPageProps = { params: Promise<{ id: string }> };

export default async function RoundPage({ params }: RoundPageProps) {
  const { id } = await params;
  const roundResult = await api.round(id);
  if (isOffline(roundResult)) return <ApiOffline />;
  if (!roundResult.ok) notFound();
  const round = roundResult.data;

  const [previewResult, signalsResult] = await Promise.all([
    api.ddPreview(round.id),
    api.signals(round.startupId),
  ]);
  const preview = previewResult.ok ? previewResult.data : null;
  const signals = listOrEmpty(signalsResult).items;

  return (
    <div className="flex flex-col gap-4">
      <RoundHeader round={round} />
      <div className="flex flex-col gap-3 rounded-lg border border-line bg-panel/90 p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">founder actions</p>
        <RoundActions roundId={round.id} startupId={round.startupId} />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <DdPreview preview={preview} />
          <SignalsTable signals={signals} />
          <InvestmentsList investments={round.investments ?? []} />
        </div>
        <div className="flex flex-col gap-4">
          <OnchainPanel round={round} />
          <Milestones milestones={round.milestones} />
          <PremiumCallout roundId={round.id} />
        </div>
      </div>
    </div>
  );
}
