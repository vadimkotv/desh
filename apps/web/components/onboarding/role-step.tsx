'use client';

import { useState } from 'react';
import type { AccountRole } from '@agentipo/shared';
import { useSession } from '@/lib/session-context';

type Choice = { role: AccountRole; title: string; blurb: string; bullets: string[]; tone: string };

const CHOICES: Choice[] = [
  {
    role: 'FOUNDER',
    title: 'I am raising',
    blurb: 'List your startup and let agents underwrite it from data instead of a deck.',
    bullets: ['Publish links, contracts and a token', 'Metrics as a trajectory, not a snapshot', 'Keep the sensitive ones gated and open them per agent'],
    tone: 'hover:border-accent/60 focus-visible:border-accent/60',
  },
  {
    role: 'INVESTOR',
    title: 'I am investing',
    blurb: 'Write a mandate. An agent reads the data and acts inside it — alone, or with your sign-off.',
    bullets: ['The mandate is the only thing you write', 'Fully autonomous, or you approve each ticket', 'Every decision anchored on Hedera'],
    tone: 'hover:border-agent/60 focus-visible:border-agent/60',
  },
];

export function RoleStep() {
  const { chooseRole } = useSession();
  const [busy, setBusy] = useState<AccountRole | null>(null);

  const pick = async (role: AccountRole) => {
    setBusy(role);
    try {
      await chooseRole(role);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {CHOICES.map((choice) => (
        <button
          key={choice.role}
          type="button"
          onClick={() => void pick(choice.role)}
          disabled={busy !== null}
          className={`flex flex-col gap-2 rounded-lg border border-line bg-panel/90 p-4 text-left transition-colors disabled:opacity-60 ${choice.tone}`}
        >
          <span className="text-[15px] font-semibold text-bright">{choice.title}</span>
          <span className="text-[12.5px] leading-relaxed text-muted">{choice.blurb}</span>
          <ul className="mt-1 flex flex-col gap-1">
            {choice.bullets.map((bullet) => (
              <li key={bullet} className="font-mono text-[10.5px] text-dim">— {bullet}</li>
            ))}
          </ul>
          <span className="mt-2 font-mono text-[11px] text-accent">
            {busy === choice.role ? 'setting up…' : 'choose →'}
          </span>
        </button>
      ))}
    </div>
  );
}
