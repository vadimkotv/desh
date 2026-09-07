import { Badge } from '@/components/ui/badge';
import { ExternalLink } from '@/components/ui/external-link';
import { Panel } from '@/components/ui/panel';
import type { Receipt } from '@/lib/api-types';
import { atomicUsdc, formatDate, num } from '@/lib/format';
import { hederaTxUrl } from '@/lib/links';

export function ReceiptsList({ receipts }: { receipts: Receipt[] }) {
  const spent = receipts.filter((r) => r.success).reduce((s, r) => s + atomicUsdc(r.amount), 0);
  return (
    <Panel eyebrow="x402 · hedera" title="Data purchases" tone="amber" action={<span className="num text-[10.5px] text-muted">{receipts.length} · {num(spent)} USDC</span>} bodyClassName="p-0">
      {receipts.length === 0 ? (
        <p className="p-4 text-[12px] text-muted">No receipts yet — the agent pays per report when it runs.</p>
      ) : (
        <ul className="divide-y divide-line">
          {[...receipts].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((receipt) => (
            <li key={receipt.id} className="flex flex-col gap-1 px-4 py-2 font-mono text-[10.5px]">
              <div className="flex items-center justify-between gap-2">
                <span className="num text-bright">{num(atomicUsdc(receipt.amount))} USDC</span>
                <Badge tone={receipt.success ? 'accent' : 'danger'}>{receipt.success ? 'settled' : 'failed'}</Badge>
              </div>
              <div className="flex items-center justify-between gap-2 text-muted">
                <span className="truncate" title={receipt.resource}>{receipt.resource.replace(/^https?:\/\/[^/]+/, '')}</span>
                <ExternalLink href={hederaTxUrl(receipt.txId)}>{receipt.txId.slice(0, 18)}…</ExternalLink>
              </div>
              <span className="text-dim">{formatDate(receipt.createdAt)} · {receipt.network} · payer {receipt.payer}</span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
