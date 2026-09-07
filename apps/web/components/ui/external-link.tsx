import type { ReactNode } from 'react';

type ExternalLinkProps = { href: string; children: ReactNode; className?: string };

export function ExternalLink({ href, children, className = '' }: ExternalLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      className={`inline-flex items-center gap-1 font-mono text-xs text-info underline-offset-4 hover:underline ${className}`}
    >
      {children}
      <span aria-hidden className="text-[10px]">↗</span>
    </a>
  );
}
