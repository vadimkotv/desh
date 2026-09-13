import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CreateRoundForm } from '@/components/startups/create-round-form';
import { GrowthPanel } from '@/components/startups/growth-panel';
import { StartupLinks } from '@/components/startups/startup-links';
import { StartupMark } from '@/components/startups/startup-mark';
import { Badge } from '@/components/ui/badge';
import { CopyButton } from '@/components/ui/copy-button';
import { ApiOffline } from '@/components/ui/empty-state';
import { api, listOrEmpty } from '@/lib/api';
import { isOffline } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function StartupPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const startupResult = await api.startup(id);
  if (isOffline(startupResult)) return <ApiOffline />;
  if (!startupResult.ok) notFound();
  const startup = startupResult.data;

  const [metricsResult, accessResult, roundsResult] = await Promise.all([
    api.metrics(id),
    api.accessRequests(id),
    api.rounds(),
  ]);
  const disclosure = metricsResult.ok ? metricsResult.data : null;
  const rounds = listOrEmpty(roundsResult).items.filter((r) => r.startupId === id);

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border border-line bg-panel/90 p-5">
        <div className="flex items-start gap-4">
          <StartupMark startup={startup} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight text-bright">{startup.name}</h1>
              <Badge tone="info">{startup.sector}</Badge>
              {rounds.length === 0 && <Badge tone="amber">no round yet</Badge>}
            </div>
            <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-muted">{startup.description}</p>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[11px]">
              <span className="flex items-center gap-1.5 text-muted">founder <CopyButton value={startup.founderAddress} /></span>
              <span className="flex items-center gap-1.5 text-muted">treasury <CopyButton value={startup.treasuryAddress} /></span>
              {startup.tokenAddress && (
                <span className="flex items-center gap-1.5 text-muted">
                  token <CopyButton value={startup.tokenAddress} /> <span className="text-dim">{startup.tokenNetwork}</span>
                </span>
              )}
              <StartupLinks startup={startup} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <GrowthPanel
            metrics={disclosure?.metrics ?? []}
            withheldCount={disclosure?.gatedCount ?? 0}
            requests={listOrEmpty(accessResult).items}
          />
          {rounds.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="eyebrow">rounds</p>
              {rounds.map((round) => (
                <Link
                  key={round.id}
                  href={`/rounds/${round.id}`}
                  className="flex items-center justify-between rounded-lg border border-line bg-panel/90 px-4 py-3 transition-colors hover:border-accent/40"
                >
                  <span className="font-mono text-[12px] text-fg">
                    {round.status} · {round.raisedUsdc} of {round.targetUsdc} USDC
                  </span>
                  <span className="font-mono text-[11px] text-accent">open →</span>
                </Link>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-col gap-4">
          <CreateRoundForm startupId={id} />
        </div>
      </div>
    </div>
  );
}
