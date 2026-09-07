import { CreateAgentSchema, type CreateAgent } from '@agentipo/shared';

// Turns raw FormData into a validated CreateAgent payload using the shared zod
// schema, so the web app can never post a shape the API would reject.
export type ParsedAgentForm = { ok: true; value: CreateAgent } | { ok: false; error: string };

const text = (data: FormData, key: string): string => String(data.get(key) ?? '').trim();
const numeric = (data: FormData, key: string): number | undefined => {
  const raw = text(data, key);
  return raw === '' ? undefined : Number(raw);
};

export function parseAgentForm(data: FormData): ParsedAgentForm {
  const candidate = {
    name: text(data, 'name'),
    ownerAddress: text(data, 'ownerAddress'),
    walletKind: text(data, 'walletKind'),
    mandate: {
      thesis: text(data, 'thesis'),
      sectors: text(data, 'sectors')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      minScore: numeric(data, 'minScore'),
      maxTicketUsdc: numeric(data, 'maxTicketUsdc'),
      maxPerRoundShareBps: numeric(data, 'maxPerRoundShareBps'),
      dailyBudgetUsdc: numeric(data, 'dailyBudgetUsdc'),
      maxDataSpendUsdc: numeric(data, 'maxDataSpendUsdc'),
      riskTolerance: text(data, 'riskTolerance'),
    },
  };
  const result = CreateAgentSchema.safeParse(candidate);
  if (result.success) return { ok: true, value: result.data };
  const first = result.error.issues[0];
  return { ok: false, error: first ? `${first.path.join('.')}: ${first.message}` : 'invalid form' };
}
