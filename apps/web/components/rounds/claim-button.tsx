'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ExternalLink } from '@/components/ui/external-link';
import { api } from '@/lib/api';
import { num } from '@/lib/format';
import { settlementTxUrl } from '@/lib/links';

type ClaimButtonProps = { agentId: string; roundId: string; claimableUsdc: number; onClaimed?: () => void };

// POST /agents/:id/claim?roundId= — pulls the agent's pro-rata share out of escrow.
// Contract reverts (409) surface their reason inline, e.g. "NothingToClaim".
export function ClaimButton({ agentId, roundId, claimableUsdc, onClaimed }: ClaimButtonProps) {
  const router = useRouter();
  const [state, setState] = useState<{ busy: boolean; text: string | null; error: boolean; tx?: { hash: string; chainId: number } }>({ busy: false, text: null, error: false });

  async function claim() {
    setState({ busy: true, text: null, error: false });
    const result = await api.claim(agentId, roundId);
    if (!result.ok) return setState({ busy: false, text: result.error, error: true });
    const tx = result.data.txHash ? { hash: result.data.txHash, chainId: result.data.chainId } : undefined;
    setState({ busy: false, text: `claimed ${num(result.data.claimedUsdc)} USDC`, error: false, tx });
    onClaimed?.();
    router.refresh();
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <Button variant="primary" size="xs" busy={state.busy} onClick={claim} disabled={claimableUsdc <= 0}>
        {state.busy ? 'Claiming…' : '↑ Claim'}
      </Button>
      {state.text && <span className={`font-mono text-[10px] ${state.error ? 'text-danger' : 'text-accent'}`}>{state.text}</span>}
      {state.tx && <ExternalLink href={settlementTxUrl(state.tx.chainId, state.tx.hash)}>arcscan</ExternalLink>}
    </span>
  );
}
