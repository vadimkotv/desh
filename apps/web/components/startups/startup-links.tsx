import type { LinkKind, Startup } from '@agentipo/shared';

// Glyphs, not logos: one row of small monospace chips reads cleanly next to the
// founder / treasury / token addresses and needs no icon library.
const GLYPH: Record<LinkKind, string> = {
  website: '⌘',
  twitter: '𝕏',
  github: '⑂',
  docs: '≡',
  discord: '◗',
  telegram: '➤',
  linkedin: 'in',
  farcaster: '⌁',
  explorer: '⛓',
  other: '↗',
};

const host = (url: string): string => {
  try {
    return new URL(url).host.replace(/^www\./, '');
  } catch {
    return url;
  }
};

// The startup's public presence. `website` and `githubRepo` are first-class columns,
// so they are folded in here and de-duplicated against the free-form links.
export function startupLinks(startup: Startup): { kind: LinkKind; url: string; label: string }[] {
  const all = [
    ...(startup.website ? [{ kind: 'website' as const, url: startup.website }] : []),
    ...(startup.githubRepo ? [{ kind: 'github' as const, url: `https://github.com/${startup.githubRepo}` }] : []),
    ...startup.links,
  ];
  const seen = new Set<string>();
  return all
    .filter((link) => !seen.has(link.url) && seen.add(link.url))
    .map((link) => ({ kind: link.kind, url: link.url, label: link.label ?? host(link.url) }));
}

export function StartupLinks({ startup }: { startup: Startup }) {
  const links = startupLinks(startup);
  if (links.length === 0) return null;
  return (
    <span className="flex flex-wrap items-center gap-1.5">
      {links.map((link) => (
        <a
          key={link.url}
          href={link.url}
          target="_blank"
          rel="noreferrer noopener"
          title={link.url}
          className="inline-flex items-center gap-1 rounded-sm border border-line-strong bg-raised px-1.5 py-[1px] font-mono text-[10px] text-muted transition-colors hover:border-info/50 hover:text-info"
        >
          <span aria-hidden className="text-[10px] leading-none">{GLYPH[link.kind]}</span>
          {link.label}
        </a>
      ))}
    </span>
  );
}
