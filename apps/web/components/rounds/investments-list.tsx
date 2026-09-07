import Link from 'next/link';
import type { Agent, Investment, InvestmentStatus } from '@agentipo/shared';
import { Badge, type BadgeTone } from '@/components/ui/badge';
import { ExternalLink } from '@/components/ui/external-link';
import { Panel } from '@/components/ui/panel';
import { formatDate, shortAddress, shortId, usdc } from '@/lib/format';
import { settlementTxUrl } from '@/lib/links';

const statusTone: Record<InvestmentStatus, BadgeTone> = { PENDING: 'amber', CONFIRMED: 'accent', FAILED: 'danger' };

type InvestmentsListProps = { investments: Investment[]; agents: Agent[] };

export function InvestmentsList({ investments, agents }: InvestmentsListProps) {
  const names = new Map(agents.map((a) => [a.id, a.name]));
  const total = investments.filter((i) => i.status === 'CONFIRMED').reduce((s, i) => s + i.amountUsdc, 0);
  return (
    <Panel eyebrow="settlement" title="Investments" action={<span className="num text-[10.5px] text-muted">{investments.length} tickets · {usdc(total)} confirmed</span>} bodyClassName="p-0">
      {investments.length === 0 ? (
        <p className="p-4 text-[12px] text-muted">No agent has invested in this round yet.</p>
      ) : (
        <ul className="divide-y divide-line">
          {[...investments].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((investment) => (
            <li key={investment.id} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-2 font-mono text-[11px] transition-colors hover:bg-hover sm:grid-cols-[90px_1fr_110px_auto]">
              <Badge tone={statusTone[investment.status]} title={investment.error ?? undefined}>{investment.status}</Badge>
              <Link href={`/agents/${investment.agentId}`} className="truncate text-agent hover:underline">
                {names.get(investment.agentId) ?? `agent ${shortId(investment.agentId)}`}
              </Link>
              <span className="num text-right text-bright">{usdc(investment.amountUsdc)}</span>
              <span className="col-span-3 flex items-center justify-between gap-3 text-muted sm:col-span-1 sm:justify-end">
                <span className="text-dim">{formatDate(investment.createdAt)}</span>
                {investment.txHash ? (
                  <ExternalLink href={settlementTxUrl(investment.chainId, investment.txHash)}>{shortAddress(investment.txHash, 5)}</ExternalLink>
                ) : (
                  <span className="max-w-[260px] truncate text-danger" title={investment.error ?? 'no tx'}>{investment.error ?? 'no tx'}</span>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
