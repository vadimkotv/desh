'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useSession } from '@/lib/session-context';
import { FounderStep } from './founder-step';
import { InvestorStep } from './investor-step';
import { RoleStep } from './role-step';
import { StepRail } from './step-rail';

export function Onboarding() {
  const { ready, session, privy, connect } = useSession();
  const [busy, setBusy] = useState(false);
  const role = session?.account.role ?? null;
  const step = !session ? 0 : role === null ? 1 : 2;

  const start = async () => {
    setBusy(true);
    try {
      await connect();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <div>
        <p className="eyebrow text-accent">get started</p>
        <h1 className="mt-1 text-xl font-semibold tracking-tight text-bright">
          {step === 0 ? 'Sign in' : step === 1 ? 'Which side are you on?' : role === 'FOUNDER' ? 'List your startup' : 'Write your mandate'}
        </h1>
        <p className="mt-1 text-[12.5px] text-muted">
          {step === 0
            ? 'One account, either side of the table. You can do both later.'
            : step === 1
              ? 'This only decides what you see first — nothing is locked in.'
              : role === 'FOUNDER'
                ? 'Everything an agent can verify on-chain, plus the numbers only you have.'
                : 'Your agent will only ever act inside what you write here.'}
        </p>
      </div>

      <StepRail step={step} role={role} />

      {!ready ? (
        <p className="font-mono text-[11px] text-dim"><span className="live-dot">●</span> loading…</p>
      ) : step === 0 ? (
        <div className="flex flex-col items-start gap-3 rounded-lg border border-line bg-panel/90 p-5">
          <div className="flex items-center gap-2">
            <Badge tone={privy ? 'accent' : 'amber'}>{privy ? 'privy' : 'demo mode'}</Badge>
            <span className="font-mono text-[10.5px] text-dim">
              {privy ? 'email, wallet or Google — an embedded wallet is created for you' : 'no PRIVY_APP_ID configured — a local session is used instead'}
            </span>
          </div>
          <Button variant="primary" busy={busy} onClick={() => void start()}>
            {busy ? 'Connecting…' : privy ? 'Continue with Privy' : 'Continue in demo mode'}
          </Button>
        </div>
      ) : step === 1 ? (
        <RoleStep />
      ) : role === 'FOUNDER' ? (
        <FounderStep />
      ) : (
        <InvestorStep />
      )}
    </div>
  );
}
