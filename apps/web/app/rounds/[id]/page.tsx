import { notFound } from 'next/navigation';
import { DdSection } from '@/components/rounds/dd-section';
import { InvestmentsList } from '@/components/rounds/investments-list';
import { OnchainPanel } from '@/components/rounds/onchain-panel';
import { RoundHeader } from '@/components/rounds/round-header';
import { SignalsTable } from '@/components/rounds/signals-table';
import { SwarmPanel } from '@/components/rounds/swarm-panel';
import { X402Callout } from '@/components/rounds/x402-callout';
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

  const [previewResult, historyResult, signalsResult, agentsResult, pricingResult, onchainResult] = await Promise.all([
    api.ddPreview(round.id),
    api.ddHistory(round.id),
    api.signals(round.startupId),
    api.agents(),
    api.pricing(),
    round.onchainRoundId !== null ? api.onchainRound(round.onchainRoundId) : Promise.resolve(null),
  ]);
  const preview = previewResult.ok ? previewResult.data : null;
  const history = listOrEmpty(historyResult).items;
  const signals = listOrEmpty(signalsResult).items;
  const agents = listOrEmpty(agentsResult).items;

  return (
    <div className="flex flex-col gap-4">
      <RoundHeader round={round} />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <DdSection roundId={round.id} startupId={round.startupId} preview={preview} history={history} />
          <SwarmPanel roundId={round.id} agents={agents} />
          <SignalsTable signals={signals} />
          <InvestmentsList investments={round.investments ?? []} agents={agents} />
        </div>
        <div className="flex flex-col gap-4">
          <OnchainPanel round={round} onchain={onchainResult?.ok ? onchainResult.data : null} />
          <X402Callout roundId={round.id} pricing={pricingResult.ok ? pricingResult.data : null} />
        </div>
      </div>
    </div>
  );
}
