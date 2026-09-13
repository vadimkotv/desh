'use client';

import type { ReactNode } from 'react';
import { Onboarding } from '@/components/onboarding/onboarding';
import { Wordmark } from '@/components/brand/logo';
import { useSession } from '@/lib/session-context';

// Nothing in the app is readable before sign-in. Every route renders through this gate,
// so a visitor who lands deep in the app still gets the sign-in screen first and is not
// bounced between routes — the address stays put and opens once the account is real.
export function AuthGate({ children }: { children: ReactNode }) {
  const { ready, session } = useSession();

  if (!ready) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <Wordmark size={40} tagline />
        <p className="font-mono text-[11px] text-dim">
          <span className="live-dot">●</span> checking your session…
        </p>
      </div>
    );
  }

  // No account, or an account that has not picked a side yet: the onboarding flow owns
  // the screen. It renders sign-in first and the investor/founder choice straight after.
  if (!session || session.account.role === null) return <Onboarding />;

  return <>{children}</>;
}
