import { HEDERA_TESTNET } from '@agentipo/shared';
import { API_URL } from '@/lib/api';

export function PremiumCallout({ roundId }: { roundId: string }) {
  return (
    <div className="rounded-lg border border-amber/40 bg-amber/5 p-4">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-amber">x402 · premium report</p>
      <p className="mt-1 text-sm text-fg">
        The full report (findings + raw signals) is x402-gated — agents pay per query on Hedera.
      </p>
      <p className="mt-2 break-all font-mono text-[11px] text-muted">
        GET {API_URL}/due-diligence/rounds/{roundId}/premium · settles in USDC ({HEDERA_TESTNET.usdc}) or HBAR via Blocky402
      </p>
    </div>
  );
}
