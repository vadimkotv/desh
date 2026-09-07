import Link from 'next/link';
import { NavLinks } from './nav-links';

export function TopNav() {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-ink/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="live-dot inline-block h-2 w-2 rounded-full bg-accent" aria-hidden />
          <span className="font-mono text-sm font-semibold tracking-tight text-fg">
            agent<span className="text-accent">ipo</span>
          </span>
          <span className="hidden font-mono text-[10px] uppercase tracking-[0.2em] text-muted sm:inline">
            / testnet
          </span>
        </Link>
        <NavLinks />
      </div>
    </header>
  );
}
