import type { Investment, Stats } from '@agentipo/shared';
import { Ring } from '@/components/charts/ring';
import { Sparkline } from '@/components/charts/sparkline';
import { StatTile } from '@/components/charts/stat-tile';
import type { Receipt } from '@/lib/api-types';
import { num, percent, usdcCompact } from '@/lib/format';

type KpiStripProps = { stats: Stats | null; investments: Investment[]; receipts: Receipt[] };

// Cumulative series over time: the sparkline's shape is "how fast capital arrived".
function cumulative(values: number[]): number[] {
  let sum = 0;
  return values.map((v) => (sum += v));
}

const byTime = <T extends { createdAt: string }>(items: T[]) =>
  [...items].sort((a, b) => a.createdAt.localeCompare(b.createdAt));

export function KpiStrip({ stats, investments, receipts }: KpiStripProps) {
  if (!stats) return null;
  const raisedPct = percent(stats.raisedUsdc, stats.targetUsdc);
  const invested = cumulative(byTime(investments.filter((i) => i.status === 'CONFIRMED')).map((i) => i.amountUsdc));
  const purchases = cumulative(byTime(receipts).map(() => 1));
  const anchoredPct = percent(stats.hcsAnchored, stats.auditEntries);
  return (
    <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 2xl:grid-cols-6">
      <StatTile
        label="Raised vs target"
        value={usdcCompact(stats.raisedUsdc)}
        hint={`${Math.round(raisedPct)}% of ${usdcCompact(stats.targetUsdc)} · ${stats.openRounds} open`}
        tone="accent"
        viz={<Ring value={raisedPct} size={44} stroke={5} color="var(--color-chart-accent)" />}
      />
      <StatTile
        label="USDC invested"
        value={usdcCompact(stats.investedUsdc)}
        hint={`${stats.investments} tickets on Arc`}
        tone="accent"
        viz={invested.length > 1 ? <Sparkline values={invested} min={0} width={88} height={30} /> : undefined}
      />
      <StatTile
        label="Returned to agents"
        value={usdcCompact(stats.claimedUsdc)}
        hint={`of ${usdcCompact(stats.proceedsUsdc)} exit proceeds`}
        tone="accent"
        viz={<Ring value={percent(stats.claimedUsdc, stats.proceedsUsdc)} size={44} stroke={5} color="var(--color-chart-accent)" showValue={false} />}
      />
      <StatTile label="Decisions" value={num(stats.decisions)} hint={`${stats.agents} agents · mandate-bound`} tone="agent" />
      <StatTile
        label="Data purchases"
        value={num(stats.dataPurchases)}
        hint="x402 receipts · Hedera"
        tone="amber"
        viz={purchases.length > 1 ? <Sparkline values={purchases} min={0} width={88} height={30} color="var(--color-chart-warn)" /> : undefined}
      />
      <StatTile
        label="HCS anchored"
        value={`${num(stats.hcsAnchored)} / ${num(stats.auditEntries)}`}
        hint={stats.hcsAnchored === 0 ? 'audit local only' : 'audit entries on Hedera'}
        viz={<Ring value={anchoredPct} size={44} stroke={5} color="var(--color-chart-agent)" showValue={false} />}
      />
    </div>
  );
}
