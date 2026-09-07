import Link from 'next/link';
import { NavLinks } from './nav-links';

export function TopNav() {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-ink/85 backdrop-blur">
      <div className="mx-auto flex h-12 max-w-[1400px] items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="relative flex h-5 w-5 items-center justify-center rounded-sm border border-accent/50 bg-accent/10">
            <span className="live-dot h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
          </span>
          <span className="font-mono text-[13px] font-semibold tracking-tight text-bright">
            agent<span className="text-accent">ipo</span>
          </span>
          <span className="hidden font-mono text-[10px] uppercase tracking-[0.2em] text-dim md:inline">
            / testnet ops
          </span>
        </Link>
        <NavLinks />
      </div>
    </header>
  );
}
