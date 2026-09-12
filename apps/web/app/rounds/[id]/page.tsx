import { notFound } from 'next/navigation';
import { GrowthPanel } from '@/components/startups/growth-panel';
import { DdSection } from '@/components/rounds/dd-section';
import { InvestmentsList } from '@/components/rounds/investments-list';
import { LifecycleStrip } from '@/components/rounds/lifecycle-strip';
import { OperatorActions } from '@/components/rounds/operator-actions';
import { ReturnsPanel } from '@/components/rounds/returns-panel';
import { OnchainPanel } from '@/components/rounds/onchain-panel';
import { RoundHeader } from '@/components/rounds/round-header';
import { SignalsTable } from '@/components/rounds/signals-table';
import { SwarmPanel } from '@/components/rounds/swarm-panel';
import { DataAccessCallout } from '@/components/rounds/data-access-callout';
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

  const onchain = round.onchainRoundId !== null;
  const [
    reportResult,
    historyResult,
    signalsResult,
    metricsResult,
    accessResult,
    agentsResult,
    pricingResult,
    healthResult,
    onchainResult,
    returnsResult,
    exitsResult,
  ] = await Promise.all([
    api.ddReport(round.id),
    api.ddHistory(round.id),
    api.signals(round.startupId),
    api.metrics(round.startupId),
    api.accessRequests(round.startupId),
    api.agents(),
    api.pricing(),
    api.health(),
    onchain ? api.onchainRound(round.onchainRoundId as number) : Promise.resolve(null),
    onchain ? api.roundReturns(round.id) : Promise.resolve(null),
    onchain ? api.exits(round.id) : Promise.resolve(null),
  ]);
  const chain = onchainResult?.ok ? onchainResult.data : null;
  const returns = returnsResult?.ok ? returnsResult.data : null;
  const exits = exitsResult?.ok ? exitsResult.data : [];
  const report = reportResult.ok ? reportResult.data : null;
  const history = listOrEmpty(historyResult).items;
  const signals = listOrEmpty(signalsResult).items;
  const disclosure = metricsResult.ok ? metricsResult.data : null;
  const accessRequests = listOrEmpty(accessResult).items;
  const agents = listOrEmpty(agentsResult).items;

  return (
    <div className="flex flex-col gap-4">
      <RoundHeader round={round} />
      <LifecycleStrip status={round.status} />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <GrowthPanel
            metrics={disclosure?.metrics ?? []}
            withheldCount={disclosure?.gatedCount ?? 0}
            requests={accessRequests}
          />
          <DdSection startupId={round.startupId} report={report} history={history} />
          <SwarmPanel roundId={round.id} agents={agents} round={round} status={round.status} />
          <ReturnsPanel returns={returns} exits={exits} chainId={round.investments[0]?.chainId ?? 0} />
          <SignalsTable signals={signals} />
          <InvestmentsList investments={round.investments ?? []} agents={agents} />
        </div>
        <div className="flex flex-col gap-4">
          <OnchainPanel round={round} onchain={chain} />
          {onchain && (
            <OperatorActions round={round} releasedCount={chain?.releasedCount ?? 0} />
          )}
          <DataAccessCallout
            roundId={round.id}
            pricing={pricingResult.ok ? pricingResult.data : null}
            paywalled={healthResult.ok && healthResult.data.features.x402}
          />
        </div>
      </div>
    </div>
  );
}
