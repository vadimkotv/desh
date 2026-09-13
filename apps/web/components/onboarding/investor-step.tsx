'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { AgentMode } from '@agentipo/shared';
import { parseAgentForm } from '@/components/agents/agent-form-parse';
import { Field, Input, Select } from '@/components/agents/form-field';
import { MandateFields } from '@/components/agents/mandate-fields';
import { InlineStatus, type ActionStatus } from '@/components/ui/action-button';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { useSession } from '@/lib/session-context';

// An investor's onboarding ends with a working agent, not an empty dashboard. The
// mandate is the only thing a human writes here — never a buy order.
export function InvestorStep() {
  const router = useRouter();
  const { session, refresh } = useSession();
  const [status, setStatus] = useState<ActionStatus>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    if (session?.account.walletAddress) data.set('ownerAddress', session.account.walletAddress);
    const parsed = parseAgentForm(data);
    if (!parsed.ok) return setStatus({ tone: 'error', text: parsed.error });

    setStatus({ tone: 'pending', text: 'Provisioning wallet + Hedera account…' });
    const created = await api.createAgent({ ...parsed.value, ownerAccountId: session?.account.id });
    if (!created.ok) return setStatus({ tone: 'error', text: `${created.status || 'offline'} · ${created.error}` });

    setStatus({ tone: 'ok', text: `${created.data.name} is ready` });
    await refresh();
    router.push(`/agents/${created.data.id}`);
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
      <Field label="agent name">
        <Input name="name" placeholder="Atlas Seed Fund" required />
      </Field>
      <Field label="mode" hint="advisory = you approve every ticket">
        <Select name="mode" options={AgentMode.options} defaultValue="AUTONOMOUS" />
      </Field>
      <Field label="owner address" hint="EVM · yours" className="sm:col-span-2">
        <Input name="ownerAddress" defaultValue={session?.account.walletAddress ?? ''} placeholder="0x…" required />
      </Field>
      <MandateFields />
      <input type="hidden" name="walletKind" value="LOCAL_KEY" />
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <Button type="submit" variant="agent" busy={status?.tone === 'pending'}>
          {status?.tone === 'pending' ? 'Provisioning…' : 'Create my agent'}
        </Button>
        {status && <InlineStatus status={status} />}
      </div>
    </form>
  );
}
