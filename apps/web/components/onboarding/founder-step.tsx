'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Field, Input, Select, TextArea } from '@/components/agents/form-field';
import { InlineStatus, type ActionStatus } from '@/components/ui/action-button';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { useSession } from '@/lib/session-context';
import { MetricsFields } from './metrics-fields';
import { parseStartupForm } from './startup-form-parse';

const SECTORS = ['defi', 'ai', 'fintech', 'infra', 'gaming', 'consumer'];

// The founder's whole listing in one form: who you are, what agents can verify on-chain,
// and what only you can supply — published as a trajectory and gated at your discretion.
export function FounderStep() {
  const router = useRouter();
  const { session, refresh } = useSession();
  const [status, setStatus] = useState<ActionStatus>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = parseStartupForm(new FormData(event.currentTarget), session?.account.id);
    if (!parsed.ok) return setStatus({ tone: 'error', text: parsed.error });

    setStatus({ tone: 'pending', text: 'Listing the startup…' });
    const created = await api.createStartup(parsed.startup);
    if (!created.ok) return setStatus({ tone: 'error', text: `${created.status || 'offline'} · ${created.error}` });

    for (const metric of parsed.metrics) await api.upsertMetric(created.data.id, metric);
    setStatus({ tone: 'ok', text: `${created.data.name} listed with ${parsed.metrics.length} metric(s)` });
    await refresh();
    router.push(`/startups/${created.data.id}`);
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
      <Field label="name">
        <Input name="name" placeholder="Meridian Yield" required />
      </Field>
      <Field label="sector">
        <Select name="sector" options={SECTORS} defaultValue="defi" />
      </Field>
      <Field label="description" hint="what you do, in a sentence or two" className="sm:col-span-2">
        <TextArea name="description" placeholder="On-chain yield router for stablecoin treasuries." />
      </Field>
      <Field label="logo url" hint="optional · square works best">
        <Input name="logoUrl" placeholder="https://…/logo.png" />
      </Field>
      <Field label="website" hint="optional">
        <Input name="website" placeholder="https://meridian.xyz" />
      </Field>
      <Field label="links" hint="paste any — X, GitHub, Discord, docs" className="sm:col-span-2">
        <Input name="links" placeholder="https://x.com/meridian https://github.com/meridian" />
      </Field>

      <p className="eyebrow sm:col-span-2">on-chain · what agents verify without asking you</p>
      <Field label="founder address" hint="EVM">
        <Input name="founderAddress" placeholder="0x…" required />
      </Field>
      <Field label="treasury address" hint="EVM · read by The Graph">
        <Input name="treasuryAddress" placeholder="0x…" required />
      </Field>
      <Field label="token address" hint="optional">
        <Input name="tokenAddress" placeholder="0x…" />
      </Field>
      <Field label="token network">
        <Input name="tokenNetwork" defaultValue="mainnet" />
      </Field>

      <MetricsFields />

      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <Button type="submit" variant="primary" busy={status?.tone === 'pending'}>
          {status?.tone === 'pending' ? 'Listing…' : 'List the startup'}
        </Button>
        {status && <InlineStatus status={status} />}
      </div>
    </form>
  );
}
