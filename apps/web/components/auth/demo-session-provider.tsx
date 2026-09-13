'use client';

import { useCallback, useMemo, type ReactNode } from 'react';
import { SessionContext, type SessionState } from '@/lib/session-context';
import { useAccountSession } from '@/lib/use-account-session';

// A deterministic stand-in address so a demo session looks like a wallet everywhere the
// UI expects one. It is never used to sign anything — settlement always uses the
// agent's own provisioned key.
function demoAddress(): string {
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  return `0x${[...bytes].map((b) => b.toString(16).padStart(2, '0')).join('')}`;
}

// Used when no Privy app is configured. Identical surface to the Privy provider, so
// every screen downstream is written once and neither path is a special case.
export function DemoSessionProvider({ children }: { children: ReactNode }) {
  const { ready, session, open, chooseRole, refresh, forget } = useAccountSession();

  const connect = useCallback(async () => {
    await open({ walletAddress: demoAddress() });
  }, [open]);

  const value = useMemo<SessionState>(
    () => ({ ready, session, privy: false, connect, disconnect: forget, chooseRole, refresh }),
    [ready, session, connect, forget, chooseRole, refresh],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
