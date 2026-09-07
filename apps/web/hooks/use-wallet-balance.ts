'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export type BalanceState = { status: 'loading' | 'ok' | 'error'; usdc: number | null };

// Client-side USDC balance lookup on Arc. Errors degrade to "—" rather than
// breaking the card, because the settlement rail may be offline.
export function useWalletBalance(address: string | null, refreshKey = 0): BalanceState {
  const [state, setState] = useState<BalanceState>({ status: 'loading', usdc: null });

  useEffect(() => {
    if (!address) {
      setState({ status: 'error', usdc: null });
      return;
    }
    let cancelled = false;
    setState((prev) => ({ ...prev, status: 'loading' }));
    api.walletUsdc(address).then((result) => {
      if (cancelled) return;
      setState(result.ok ? { status: 'ok', usdc: result.data.usdc } : { status: 'error', usdc: null });
    });
    return () => {
      cancelled = true;
    };
  }, [address, refreshKey]);

  return state;
}
