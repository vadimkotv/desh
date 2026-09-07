import Link from 'next/link';
import { explorerTx, hashscanTx, type Decision } from '@agentipo/shared';
import { Badge } from '@/components/ui/badge';
import { ExternalLink } from '@/components/ui/external-link';
import { shortAddress, shortId } from '@/lib/format';

// Payment + settlement links for one decision (x402 receipt on Hedera, USDC tx on Arc).
export function DecisionLinks({ decision }: { decision: Decision }) {
  const { investment } = decision;
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11px] text-muted">
      <Link href={`/rounds/${decision.roundId}`} className="text-info hover:underline">
        round {shortId(decision.roundId)}
      </Link>
      {decision.dataPaymentTxId ? (
        <span className="flex items-center gap-1">
          x402 <ExternalLink href={hashscanTx(decision.dataPaymentTxId)}>{decision.dataPaymentTxId}</ExternalLink>
        </span>
      ) : (
        <span>x402 · no payment</span>
      )}
      {investment?.txHash && (
        <span className="flex items-center gap-1">
          settle
          <ExternalLink href={explorerTx(investment.chainId, investment.txHash)}>
            {shortAddress(investment.txHash, 6)}
          </ExternalLink>
          <Badge tone={investment.status === 'CONFIRMED' ? 'accent' : investment.status === 'FAILED' ? 'danger' : 'amber'}>
            {investment.status}
          </Badge>
        </span>
      )}
    </div>
  );
}
