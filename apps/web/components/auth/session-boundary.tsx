'use client';

import { PrivyProvider } from '@privy-io/react-auth';
import type { ReactNode } from 'react';
import { DemoSessionProvider } from './demo-session-provider';
import { PrivySessionProvider } from './privy-session-provider';

const APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

// One switch for the whole app. With a Privy app id the real SDK mounts and sessions
// are verified server-side; without one the same screens run on a demo session that is
// labelled as such. The branch is a component boundary, never a conditional hook.
export function SessionBoundary({ children }: { children: ReactNode }) {
  if (!APP_ID) return <DemoSessionProvider>{children}</DemoSessionProvider>;

  return (
    <PrivyProvider
      appId={APP_ID}
      config={{
        loginMethods: ['email', 'wallet', 'google'],
        embeddedWallets: { ethereum: { createOnLogin: 'users-without-wallets' } },
        appearance: { theme: 'dark', accentColor: '#3ddc97', logo: undefined },
      }}
    >
      <PrivySessionProvider>{children}</PrivySessionProvider>
    </PrivyProvider>
  );
}
