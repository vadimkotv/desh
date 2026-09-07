import Link from 'next/link';
import type { InvestorReturn } from '@agentipo/shared';
import { Meter } from '@/components/charts/meter';
import { num, percent, shortAddress } from '@/lib/format';
import { ClaimButton } from './claim-button';

type ReturnsTableProps = { roundId: string; investors: InvestorReturn[] };

// Investor returns: contribution → expected (× cap) → claimed / claimable, with a claim per row.
export function ReturnsTable({ roundId, investors }: ReturnsTableProps) {
  if (investors.length === 0) return <p className="p-4 text-[12px] text-muted">No investors in this round yet.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-left font-mono text-[11px]">
        <thead className="border-b border-line text-[10px] uppercase tracking-wider text-muted">
          <tr>
            <th className="px-4 py-2 font-normal">agent</th>
            <th className="py-2 pr-3 text-right font-normal">contributed</th>
            <th className="py-2 pr-3 text-right font-normal">expected</th>
            <th className="py-2 pr-3 text-right font-normal">claimed</th>
            <th className="py-2 pr-3 text-right font-normal">claimable</th>
            <th className="py-2 pr-3 font-normal">repaid</th>
            <th className="py-2 pr-4 font-normal"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {investors.map((row) => {
            const pct = percent(row.claimedUsdc, row.expectedUsdc);
            return (
              <tr key={row.address} className="transition-colors hover:bg-hover">
                <td className="px-4 py-2">
                  {row.agentId ? (
                    <Link href={`/agents/${row.agentId}`} className="text-agent hover:underline">{row.agentName ?? shortAddress(row.address)}</Link>
                  ) : (
                    <span className="text-muted" title={row.address}>{shortAddress(row.address)}</span>
                  )}
                </td>
                <td className="num py-2 pr-3 text-right text-fg">{num(row.contributionUsdc)}</td>
                <td className="num py-2 pr-3 text-right text-bright">{num(row.expectedUsdc)}</td>
                <td className="num py-2 pr-3 text-right text-fg">{num(row.claimedUsdc)}</td>
                <td className={`num py-2 pr-3 text-right ${row.claimableUsdc > 0 ? 'text-accent' : 'text-dim'}`}>{num(row.claimableUsdc)}</td>
                <td className="py-2 pr-3">
                  <span className="flex items-center gap-2">
                    <Meter value={pct} tone="accent" className="w-20" />
                    <span className="num text-[10px] text-muted">{Math.round(pct)}%</span>
                  </span>
                </td>
                <td className="py-2 pr-4 text-right">
                  {row.agentId && <ClaimButton agentId={row.agentId} roundId={roundId} claimableUsdc={row.claimableUsdc} />}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
