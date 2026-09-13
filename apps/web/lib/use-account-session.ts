'use client';

import { useCallback, useEffect, useState } from 'react';
import type { AccountRole, Session, SessionRequest } from '@agentipo/shared';
import { api } from '@/lib/api';
import { rememberAccount, rememberedAccount } from '@/lib/session-context';

// The half of the session that has nothing to do with Privy: talk to the API, keep the
// account id across reloads, and expose role selection. Both providers share it, so the
// demo path and the Privy path cannot drift apart in behaviour.
export function useAccountSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    const id = rememberedAccount();
    if (!id) return setSession(null);
    const result = await api.session(id);
    if (result.ok) setSession(result.data);
    else rememberAccount(null); // the account is gone (reseeded database): start over
  }, []);

  useEffect(() => {
    void refresh().finally(() => setReady(true));
  }, [refresh]);

  const open = useCallback(async (request: SessionRequest) => {
    const result = await api.openSession(request);
    if (!result.ok) throw new Error(result.error);
    rememberAccount(result.data.account.id);
    setSession(result.data);
  }, []);

  const chooseRole = useCallback(
    async (role: AccountRole) => {
      const id = session?.account.id ?? rememberedAccount();
      if (!id) throw new Error('connect first');
      const result = await api.setRole(id, role);
      if (!result.ok) throw new Error(result.error);
      setSession(result.data);
    },
    [session],
  );

  const forget = useCallback(async () => {
    rememberAccount(null);
    setSession(null);
  }, []);

  return { ready, session, open, chooseRole, refresh, forget };
}
