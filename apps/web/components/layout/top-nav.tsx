import Link from 'next/link';
import { LogoMark } from '@/components/brand/logo';
import { NavLinks } from './nav-links';

export function TopNav() {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-ink/85 backdrop-blur">
      <div className="mx-auto flex h-12 max-w-[1400px] items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <LogoMark size={21} className="text-accent" />
          <span className="text-[14px] font-semibold tracking-tight text-bright">
            Agent<span className="text-accent">IPO</span>
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
