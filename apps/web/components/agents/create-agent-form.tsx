'use client';

import { WalletKind } from '@agentipo/shared';
import { InlineStatus } from '@/components/ui/action-button';
import { Panel } from '@/components/ui/panel';
import { Field, Input, Select } from './form-field';
import { MandateFields } from './mandate-fields';
import { useCreateAgent } from './use-create-agent';

export function CreateAgentForm() {
  const { status, busy, onSubmit } = useCreateAgent();

  return (
    <Panel eyebrow="new investor" title="Create agent">
      <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
        <Field label="name">
          <Input name="name" placeholder="Atlas Seed Fund" required />
        </Field>
        <Field label="owner address" hint="EVM">
          <Input name="ownerAddress" placeholder="0x…" required />
        </Field>
        <Field label="wallet kind" className="sm:col-span-2">
          <Select name="walletKind" options={WalletKind.options} defaultValue="LOCAL_KEY" />
        </Field>
        <MandateFields />
        <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
          <button
            type="submit"
            disabled={busy}
            className="rounded border border-accent/60 bg-accent/10 px-3 py-1.5 font-mono text-xs text-accent transition hover:bg-accent/20 disabled:cursor-wait disabled:opacity-60"
          >
            {busy ? 'Creating…' : 'Create agent'}
          </button>
          {status && <InlineStatus status={status} />}
        </div>
      </form>
    </Panel>
  );
}
