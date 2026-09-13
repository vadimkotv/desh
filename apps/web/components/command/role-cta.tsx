'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { Startup } from '@agentipo/shared';
import { StartupMark } from '@/components/startups/startup-mark';
import { api } from '@/lib/api';
import { useSession } from '@/lib/session-context';

// What this person should do next, given who they are. A signed-out visitor is invited
// in; a founder gets their listings and a way to add one; an investor gets their agents.
export function RoleCta() {
  const { ready, session } = useSession();
  const [mine, setMine] = useState<Startup[]>([]);
  // The id list is the real dependency, so it is joined into one primitive rather than
  // a fresh array identity that would re-fetch on every render.
  const startupIds = (session?.startupIds ?? []).join(',');

  useEffect(() => {
    const ids = startupIds ? startupIds.split(',') : [];
    if (ids.length === 0) return setMine([]);
    void Promise.all(ids.map((id) => api.startup(id))).then((results) =>
      setMine(results.flatMap((r) => (r.ok ? [r.data] : []))),
    );
  }, [startupIds]);

  if (!ready) return null;
  const role = session?.account.role ?? null;

  return (
    <section className="flex flex-wrap items-center gap-3 rounded-lg border border-line bg-panel/90 px-4 py-3">
      {!session ? (
        <>
          <span className="text-[12.5px] text-muted">
            Raising, or investing? One account does either.
          </span>
          <Link href="/onboarding" className={cta}>Get started →</Link>
        </>
      ) : role === 'FOUNDER' ? (
        <>
          <span className="eyebrow">your startups</span>
          {mine.map((startup) => (
            <Link key={startup.id} href={`/startups/${startup.id}`} className="flex items-center gap-1.5 rounded-md border border-line bg-raised px-2 py-1 font-mono text-[11px] text-fg transition-colors hover:border-accent/50 hover:text-accent">
              <StartupMark startup={startup} size="sm" />
              {startup.name}
            </Link>
          ))}
          <Link href="/onboarding" className={cta}>+ Create startup</Link>
        </>
      ) : (
        <>
          <span className="eyebrow">your agents</span>
          <span className="font-mono text-[11px] text-muted">
            {session.agentIds.length} running under your mandate
          </span>
          <Link href="/agents" className={cta}>Manage agents →</Link>
        </>
      )}
    </section>
  );
}

const cta =
  'ml-auto rounded-md border border-accent/40 bg-accent/10 px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider text-accent transition-colors hover:bg-accent/20';
