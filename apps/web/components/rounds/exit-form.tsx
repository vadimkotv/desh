'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ExitKind, EXIT_LABELS } from '@agentipo/shared';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { bpsShare, num, usdcCompact } from '@/lib/format';

type ExitFormProps = { roundId: string; equityBps: number; raisedUsdc: number };

const field = 'rounded-md border border-line bg-ink px-2 py-1 font-mono text-[11px] text-fg outline-none focus:border-amber/60';

// Settles a liquidity event into the round. The operator enters the headline valuation;
// the round's stake decides what actually reaches investors.
export function ExitForm({ roundId, equityBps, raisedUsdc }: ExitFormProps) {
  const router = useRouter();
  const [kind, setKind] = useState<ExitKind>('ACQUISITION');
  const [valuation, setValuation] = useState(Math.round((raisedUsdc * 10_000 * 6) / Math.max(1, equityBps)));
  const [state, setState] = useState<{ busy: boolean; text: string | null; error: boolean }>({ busy: false, text: null, error: false });
  const proceeds = Number(((valuation * equityBps) / 10_000).toFixed(6));

  async function settle() {
    setState({ busy: true, text: null, error: false });
    const result = await api.settleExit(roundId, { kind, valuationUsdc: valuation, proceedsUsdc: proceeds, evidenceUri: '' });
    if (!result.ok) return setState({ busy: false, text: result.error, error: true });
    setState({ busy: false, text: `${kind.toLowerCase()} settled · ${result.data.status}`, error: false });
    router.refresh();
  }

  return (
    <span className="inline-flex flex-wrap items-center justify-end gap-2">
      <select value={kind} onChange={(e) => setKind(e.target.value as ExitKind)} className={field} aria-label="exit kind">
        {ExitKind.options.map((option) => (
          <option key={option} value={option}>{EXIT_LABELS[option]}</option>
        ))}
      </select>
      <input
        type="number"
        min={0}
        step="any"
        value={valuation}
        onChange={(e) => setValuation(Number(e.target.value))}
        className={`w-32 ${field}`}
        aria-label="exit valuation in USDC"
      />
      <span className="num text-[10px] text-dim" title={`${bpsShare(equityBps)} of ${usdcCompact(valuation)}`}>
        → {num(proceeds)} USDC
      </span>
      <Button size="xs" variant="primary" busy={state.busy} onClick={settle} disabled={proceeds <= 0}>Settle exit</Button>
      {state.text && <span className={`font-mono text-[10px] ${state.error ? 'text-danger' : 'text-accent'}`}>{state.text}</span>}
    </span>
  );
}
