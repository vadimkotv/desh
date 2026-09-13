// The AgentIPO mark: an aperture whose frame is deliberately open at two corners —
// the agent looks in, the founder decides how much of the frame is closed.
// Drawn as inline SVG so it stays sharp at every size and takes the accent colour.
export function LogoMark({ size = 20, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      role="img"
      aria-label="AgentIPO"
      className={className}
    >
      <g fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
        <path d="M19.5 8 H12.5 A4.5 4.5 0 0 0 8 12.5 V19.5" />
        <path d="M12.5 24 H19.5 A4.5 4.5 0 0 0 24 19.5 V12.5" />
      </g>
      <circle cx="24" cy="8" r="2.05" fill="currentColor" />
      <circle cx="8" cy="24" r="2.05" fill="currentColor" />
      <circle cx="16" cy="16" r="3.15" fill="currentColor" />
    </svg>
  );
}

type WordmarkProps = { size?: number; className?: string; tagline?: boolean };

// Mark plus name. "Agent" reads as the subject, "IPO" as what it does — so the accent
// sits on the second half, never on both.
export function Wordmark({ size = 20, className = '', tagline = false }: WordmarkProps) {
  const text = size >= 40 ? 'text-[34px]' : size >= 28 ? 'text-[20px]' : 'text-[13px]';
  return (
    <span className={`flex flex-col items-center gap-2 ${className}`}>
      <span className="flex items-center gap-2.5">
        <LogoMark size={size} className="text-accent" />
        <span className={`font-semibold tracking-tight text-bright ${text}`}>
          Agent<span className="text-accent">IPO</span>
        </span>
      </span>
      {tagline ? (
        <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-dim">
          let your agent invest
        </span>
      ) : null}
    </span>
  );
}
