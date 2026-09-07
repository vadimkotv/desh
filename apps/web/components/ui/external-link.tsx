import type { ReactNode } from 'react';

type ExternalLinkProps = { href: string; children: ReactNode; className?: string; title?: string };

export function ExternalLink({ href, children, className = '', title }: ExternalLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      title={title}
      className={`inline-flex items-center gap-1 font-mono text-[11px] text-info underline-offset-4 transition-colors hover:text-bright hover:underline ${className}`}
    >
      {children}
      <span aria-hidden className="text-[9px] opacity-70">↗</span>
    </a>
  );
}
