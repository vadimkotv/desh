'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/', label: 'Rounds', match: (p: string) => p === '/' || p.startsWith('/rounds') },
  { href: '/agents', label: 'Agents', match: (p: string) => p.startsWith('/agents') },
  { href: '/audit', label: 'Audit', match: (p: string) => p.startsWith('/audit') },
];

export function NavLinks() {
  const pathname = usePathname();
  return (
    <nav className="flex items-center gap-1" aria-label="Primary">
      {links.map((link) => {
        const active = link.match(pathname);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`rounded px-2.5 py-1 font-mono text-xs uppercase tracking-wider transition ${
              active ? 'bg-accent/10 text-accent' : 'text-muted hover:text-fg'
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
