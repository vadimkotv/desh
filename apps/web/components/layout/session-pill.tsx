'use client';

import Link from 'next/link';
import { useSession } from '@/lib/session-context';

const short = (address: string): string => `${address.slice(0, 6)}…${address.slice(-4)}`;

// Who is signed in, and an honest label for how. A demo session says so rather than
// letting a screenshot imply a verified login.
export function SessionPill() {
  const { ready, session, privy, disconnect } = useSession();
  if (!ready) return null;

  if (!session) {
    return (
      <Link
        href="/onboarding"
        className="inline-flex items-center gap-1 whitespace-nowrap rounded-md border border-accent/40 bg-accent/10 px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider text-accent"
      >
        sign in
      </Link>
    );
  }

  const { account } = session;
  const label = account.walletAddress ? short(account.walletAddress) : (account.email ?? account.privyDid.slice(0, 12));
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        title={privy ? 'verified through Privy' : 'demo session — no Privy app configured'}
        className={`inline-flex items-center gap-1 whitespace-nowrap rounded-md border px-2.5 py-1 font-mono text-[11px] tracking-wider ${
          privy ? 'border-accent/35 bg-accent/10 text-accent' : 'border-amber/35 bg-amber/10 text-amber'
        }`}
      >
        {account.role && <span className="uppercase">{account.role === 'FOUNDER' ? 'founder' : 'investor'}</span>}
        <span className="hidden sm:inline">{label}</span>
        {!privy && <span className="hidden md:inline">· demo</span>}
      </span>
      <button
        type="button"
        onClick={() => void disconnect()}
        className="font-mono text-[10px] uppercase tracking-wider text-dim transition-colors hover:text-fg"
      >
        exit
      </button>
    </span>
  );
}
