import {
  CreateStartupSchema,
  type CreateStartup,
  type MetricPoint,
  type StartupLink,
  type UpsertMetric,
} from '@agentipo/shared';

export type ParsedStartup =
  | { ok: true; startup: CreateStartup; metrics: UpsertMetric[] }
  | { ok: false; error: string };

const text = (d: FormData, key: string): string => String(d.get(key) ?? '').trim();
const optional = (d: FormData, key: string): string | undefined => text(d, key) || undefined;

// "https://x.com/acme, https://acme.dev/docs" → typed links. The kind is inferred from
// the host so a founder pastes URLs instead of filling a form row per network.
const KIND_BY_HOST: [RegExp, StartupLink['kind']][] = [
  [/(^|\.)x\.com|twitter\.com/, 'twitter'],
  [/github\.com/, 'github'],
  [/discord\.(gg|com)/, 'discord'],
  [/t\.me|telegram/, 'telegram'],
  [/linkedin\.com/, 'linkedin'],
  [/warpcast|farcaster/, 'farcaster'],
  [/etherscan|arcscan|basescan|solscan/, 'explorer'],
  [/docs?\./, 'docs'],
];

export function parseLinks(raw: string): CreateStartup['links'] {
  return raw
    .split(/[\s,]+/)
    .map((url) => url.trim())
    .filter(Boolean)
    .slice(0, 12)
    .map((url) => {
      const host = ((): string => {
        try {
          return new URL(url).host;
        } catch {
          return '';
        }
      })();
      const match = KIND_BY_HOST.find(([pattern]) => pattern.test(host));
      return { kind: match ? match[1] : ('other' as const), url };
    });
}

// "500, 900, 1600, 2400" → one monthly reading each, oldest first, ending last month.
export function parseSeries(raw: string): MetricPoint[] {
  const values = raw
    .split(/[\s,]+/)
    .map((v) => Number(v.trim()))
    .filter((v) => Number.isFinite(v));
  const now = new Date();
  return values.map((value, i) => ({
    at: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (values.length - i), 1)).toISOString(),
    value,
  }));
}

const metric = (d: FormData, key: string, label: string, unit: UpsertMetric['unit']): UpsertMetric | null => {
  const points = parseSeries(text(d, `${key}.series`));
  if (points.length === 0) return null;
  return { key, label, unit, visibility: d.get(`${key}.gated`) ? 'GATED' : 'PUBLIC', points };
};

export function parseStartupForm(data: FormData, ownerAccountId?: string): ParsedStartup {
  const candidate = {
    name: text(data, 'name'),
    description: text(data, 'description'),
    sector: text(data, 'sector'),
    logoUrl: optional(data, 'logoUrl'),
    website: optional(data, 'website'),
    founderAddress: text(data, 'founderAddress'),
    treasuryAddress: text(data, 'treasuryAddress'),
    tokenAddress: optional(data, 'tokenAddress'),
    tokenNetwork: text(data, 'tokenNetwork') || 'mainnet',
    githubRepo: optional(data, 'githubRepo'),
    links: parseLinks(text(data, 'links')),
    ownerAccountId,
  };
  const result = CreateStartupSchema.safeParse(candidate);
  if (!result.success) {
    const first = result.error.issues[0];
    return { ok: false, error: first ? `${first.path.join('.')}: ${first.message}` : 'invalid form' };
  }
  const metrics = [
    metric(data, 'revenue.mrr.usd', 'MRR', 'usd'),
    metric(data, 'users.active.count', 'Active users', 'count'),
    metric(data, 'revenue.net.usd', 'Net revenue', 'usd'),
  ].filter((m): m is UpsertMetric => m !== null);
  return { ok: true, startup: result.data, metrics };
}
