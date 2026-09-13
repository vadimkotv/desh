'use client';

import { useCallback, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { SessionContext, type SessionState } from '@/lib/session-context';
import { useAccountSession } from '@/lib/use-account-session';

// Privy owns the identity; the API owns the account. This bridges them: once Privy
// reports an authenticated user, its access token is exchanged for our session exactly
// once per login, and the linked wallet (embedded or external) rides along.
export function PrivySessionProvider({ children }: { children: ReactNode }) {
  const { ready: privyReady, authenticated, user, login, logout, getAccessToken } = usePrivy();
  const { wallets } = useWallets();
  const { ready, session, open, chooseRole, refresh, forget } = useAccountSession();
  const exchanged = useRef<string | null>(null);

  const walletAddress = wallets[0]?.address ?? user?.wallet?.address;

  useEffect(() => {
    if (!privyReady || !authenticated || !user) return;
    if (exchanged.current === user.id) return;
    exchanged.current = user.id;
    void (async () => {
      const accessToken = (await getAccessToken()) ?? undefined;
      await open({ accessToken, privyDid: user.id, walletAddress, email: user.email?.address });
    })();
  }, [privyReady, authenticated, user, walletAddress, getAccessToken, open]);

  const disconnect = useCallback(async () => {
    exchanged.current = null;
    await forget();
    await logout();
  }, [forget, logout]);

  const value = useMemo<SessionState>(
    () => ({
      ready: ready && privyReady,
      session,
      privy: true,
      connect: async () => login(),
      disconnect,
      chooseRole,
      refresh,
    }),
    [ready, privyReady, session, login, disconnect, chooseRole, refresh],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
