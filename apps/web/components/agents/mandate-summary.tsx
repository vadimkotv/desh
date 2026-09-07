import type { Mandate } from '@agentipo/shared';
import { Badge } from '@/components/ui/badge';
import { usdc } from '@/lib/format';

// One-line mandate digest used on agent cards.
export function MandateSummary({ mandate }: { mandate: Mandate }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-1">
        {mandate.sectors.map((sector) => (
          <Badge key={sector} tone="info">{sector}</Badge>
        ))}
      </div>
      <p className="font-mono text-[11px] text-muted">
        max ticket <span className="text-fg">{usdc(mandate.maxTicketUsdc)}</span> · min score{' '}
        <span className="text-fg">{mandate.minScore}</span> · {mandate.riskTolerance}
      </p>
    </div>
  );
}
