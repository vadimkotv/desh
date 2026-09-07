'use client';

import { WalletKind } from '@agentipo/shared';
import { InlineStatus } from '@/components/ui/action-button';
import { Button } from '@/components/ui/button';
import { Panel } from '@/components/ui/panel';
import { Field, Input, Select } from './form-field';
import { MandateFields } from './mandate-fields';
import { useCreateAgent } from './use-create-agent';

// The only place a human expresses intent: a mandate, never a buy order.
export function CreateAgentForm() {
  const { status, busy, onSubmit } = useCreateAgent();

  return (
    <Panel eyebrow="new investor · human writes the mandate" title="Create agent" tone="agent">
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
          <Button type="submit" variant="agent" busy={busy}>
            {busy ? 'Provisioning…' : '+ Create agent'}
          </Button>
          {status && <InlineStatus status={status} />}
        </div>
      </form>
    </Panel>
  );
}
