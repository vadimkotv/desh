import Link from 'next/link';
import { explorerTx, type Investment, type InvestmentStatus } from '@agentipo/shared';
import { Badge, type BadgeTone } from '@/components/ui/badge';
import { ExternalLink } from '@/components/ui/external-link';
import { Panel } from '@/components/ui/panel';
import { formatDate, shortAddress, shortId, usdc } from '@/lib/format';

const statusTone: Record<InvestmentStatus, BadgeTone> = {
  PENDING: 'amber',
  CONFIRMED: 'accent',
  FAILED: 'danger',
};

export function InvestmentsList({ investments }: { investments: Investment[] }) {
  return (
    <Panel eyebrow="settlement" title="Investments" action={<span className="font-mono text-[11px] text-muted">{investments.length} tickets</span>}>
      {investments.length === 0 ? (
        <p className="text-xs text-muted">No agent has invested in this round yet.</p>
      ) : (
        <ul className="divide-y divide-line">
          {investments.map((investment) => (
            <li key={investment.id} className="flex flex-wrap items-center justify-between gap-2 py-2 font-mono text-xs">
              <div className="flex items-center gap-2">
                <Badge tone={statusTone[investment.status]}>{investment.status}</Badge>
                <Link href={`/agents/${investment.agentId}`} className="text-info hover:underline">
                  agent {shortId(investment.agentId)}
                </Link>
              </div>
              <span className="text-fg">{usdc(investment.amountUsdc)}</span>
              <span className="text-muted">{formatDate(investment.createdAt)}</span>
              {investment.txHash ? (
                <ExternalLink href={explorerTx(investment.chainId, investment.txHash)}>
                  {shortAddress(investment.txHash, 6)}
                </ExternalLink>
              ) : (
                <span className="text-muted">no tx</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
