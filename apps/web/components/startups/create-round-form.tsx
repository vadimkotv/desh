'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { entryValuation } from '@agentipo/shared';
import { Field, Input } from '@/components/agents/form-field';
import { InlineStatus, type ActionStatus } from '@/components/ui/action-button';
import { Button } from '@/components/ui/button';
import { Panel } from '@/components/ui/panel';
import { api } from '@/lib/api';
import { usdcCompact } from '@/lib/format';

const DAY = 86_400_000;

// Opening a round is where the founder sets the price: a stake and a target imply the
// valuation, so it is shown live rather than left as arithmetic for the reader.
export function CreateRoundForm({ startupId }: { startupId: string }) {
  const router = useRouter();
  const [target, setTarget] = useState(5_000);
  const [equityBps, setEquityBps] = useState(800);
  const [status, setStatus] = useState<ActionStatus>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const days = Number(data.get('days') ?? 21);
    setStatus({ tone: 'pending', text: 'Creating the escrow round…' });
    const result = await api.createRound({
      startupId,
      targetUsdc: target,
      minTicketUsdc: Number(data.get('minTicketUsdc') ?? 10),
      deadline: new Date(Date.now() + days * DAY).toISOString(),
      equityBps,
      milestones: [
        { title: String(data.get('m1') || 'Milestone 1'), releaseBps: 5_000 },
        { title: String(data.get('m2') || 'Milestone 2'), releaseBps: 5_000 },
      ],
    });
    if (!result.ok) return setStatus({ tone: 'error', text: `${result.status || 'offline'} · ${result.error}` });
    setStatus({ tone: 'ok', text: 'round open' });
    router.push(`/rounds/${result.data.id}`);
  }

  return (
    <Panel eyebrow="founder · open a round" title="Raise" tone="accent">
      <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
        <Field label="target" hint="USDC">
          <input
            name="targetUsdc" type="number" step="any" min={1} value={target}
            onChange={(e) => setTarget(Number(e.target.value))}
            className="w-full rounded-md border border-line bg-ink px-2.5 py-1.5 font-mono text-xs text-fg outline-none focus:border-accent/60"
          />
        </Field>
        <Field label="equity sold" hint="bps · 800 = 8%">
          <input
            name="equityBps" type="number" min={10} max={5000} value={equityBps}
            onChange={(e) => setEquityBps(Number(e.target.value))}
            className="w-full rounded-md border border-line bg-ink px-2.5 py-1.5 font-mono text-xs text-fg outline-none focus:border-accent/60"
          />
        </Field>
        <p className="font-mono text-[11px] text-muted sm:col-span-2">
          {(equityBps / 100).toFixed(2).replace(/\.?0+$/, '')}% for {usdcCompact(target)} ={' '}
          <span className="text-bright">{usdcCompact(entryValuation(target, equityBps))}</span> valuation
        </p>
        <Field label="min ticket" hint="USDC">
          <Input name="minTicketUsdc" type="number" step="any" defaultValue={10} />
        </Field>
        <Field label="open for" hint="days">
          <Input name="days" type="number" defaultValue={21} />
        </Field>
        <Field label="milestone 1" hint="50% released">
          <Input name="m1" placeholder="Mainnet launch" />
        </Field>
        <Field label="milestone 2" hint="50% released">
          <Input name="m2" placeholder="Audit + v2" />
        </Field>
        <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
          <Button type="submit" variant="primary" busy={status?.tone === 'pending'}>Open the round</Button>
          {status && <InlineStatus status={status} />}
        </div>
      </form>
    </Panel>
  );
}
