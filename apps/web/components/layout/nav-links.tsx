'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ActiveAgentStatus } from './active-agent-status';
import { SessionPill } from './session-pill';

const links = [
  { href: '/', label: 'Command center', short: 'Center', match: (p: string) => p === '/' },
  { href: '/rounds', label: 'Rounds', match: (p: string) => p.startsWith('/rounds') },
  { href: '/agents', label: 'Agents', match: (p: string) => p.startsWith('/agents') },
  { href: '/audit', label: 'Audit', match: (p: string) => p.startsWith('/audit') },
];

export function NavLinks() {
  const pathname = usePathname();
  return (
    <nav className="flex items-center gap-1.5" aria-label="Primary">
      <ActiveAgentStatus />
      <SessionPill />
      {links.map((link) => {
        const active = link.match(pathname);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? 'page' : undefined}
            className={`whitespace-nowrap rounded-md px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider transition-colors ${
              active ? 'bg-accent/10 text-accent' : 'text-muted hover:bg-raised hover:text-fg'
            }`}
          >
            <span className="sm:hidden">{link.short ?? link.label}</span>
            <span className="hidden sm:inline">{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
