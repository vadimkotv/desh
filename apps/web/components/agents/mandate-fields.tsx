import { Field, Input, Select, TextArea } from './form-field';

// Mandate inputs of the create-agent form. Defaults mirror MandateSchema defaults.
export function MandateFields() {
  return (
    <>
      <Field label="thesis" hint="10–1000 chars" className="sm:col-span-2">
        <TextArea name="thesis" placeholder="Back early on-chain infra teams with real token distribution and a funded treasury." />
      </Field>
      <Field label="sectors" hint="comma separated" className="sm:col-span-2">
        <Input name="sectors" placeholder="defi, infra, ai" required />
      </Field>
      <Field label="min DD score" hint="0–100">
        <Input name="minScore" type="number" defaultValue={60} />
      </Field>
      <Field label="max ticket" hint="USDC">
        <Input name="maxTicketUsdc" type="number" step="any" defaultValue={100} required />
      </Field>
      <Field label="max per-round share" hint="bps">
        <Input name="maxPerRoundShareBps" type="number" defaultValue={2000} />
      </Field>
      <Field label="daily budget" hint="USDC">
        <Input name="dailyBudgetUsdc" type="number" step="any" defaultValue={500} required />
      </Field>
      <Field label="max data spend" hint="USDC">
        <Input name="maxDataSpendUsdc" type="number" step="any" defaultValue={1} />
      </Field>
      <Field label="risk tolerance">
        <Select name="riskTolerance" options={['conservative', 'balanced', 'aggressive']} defaultValue="balanced" />
      </Field>
    </>
  );
}
