'use client';

import { createContext, useContext } from 'react';
import type { AccountRole, Session } from '@agentipo/shared';

export type SessionState = {
  ready: boolean; // the auth layer has finished booting
  session: Session | null;
  // True when a real Privy app is configured. False means the session is a clearly
  // marked demo one, and the UI says so rather than pretending otherwise.
  privy: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  chooseRole: (role: AccountRole) => Promise<void>;
  refresh: () => Promise<void>;
};

export const SessionContext = createContext<SessionState | null>(null);

export function useSession(): SessionState {
  const state = useContext(SessionContext);
  if (!state) throw new Error('useSession must be used inside <SessionBoundary>');
  return state;
}

const KEY = 'agentipo.accountId';

// The account id survives a reload so onboarding is not repeated on every refresh.
// Per-viewer convenience only — the server is still the source of truth for the role.
export const rememberedAccount = (): string | null => {
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
};

export const rememberAccount = (id: string | null): void => {
  try {
    if (id) window.localStorage.setItem(KEY, id);
    else window.localStorage.removeItem(KEY);
  } catch {
    // private window or blocked storage — the session just won't persist
  }
};
