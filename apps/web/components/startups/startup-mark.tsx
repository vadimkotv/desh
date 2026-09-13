import type { Startup } from '@agentipo/shared';

const SIZES = { sm: 'h-6 w-6 text-[10px]', md: 'h-9 w-9 text-[13px]', lg: 'h-12 w-12 text-[17px]' } as const;

// Deterministic hue from the name, so a startup without a logo still has a stable mark
// instead of a grey square that looks like a loading state.
const hueOf = (name: string): number =>
  [...name].reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) % 360, 7);

const initials = (name: string): string =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0] ?? '')
    .join('')
    .toUpperCase();

type StartupMarkProps = { startup: Pick<Startup, 'name' | 'logoUrl'>; size?: keyof typeof SIZES };

export function StartupMark({ startup, size = 'md' }: StartupMarkProps) {
  const box = `${SIZES[size]} shrink-0 overflow-hidden rounded-md border border-line-strong`;
  if (startup.logoUrl) {
    // A founder-supplied URL on any host: next/image would need every domain allow-listed.
    return <img src={startup.logoUrl} alt="" className={`${box} bg-raised object-cover`} />;
  }
  const hue = hueOf(startup.name);
  return (
    <span
      aria-hidden
      className={`${box} flex items-center justify-center font-mono font-semibold`}
      style={{ background: `hsl(${hue} 40% 14%)`, color: `hsl(${hue} 70% 68%)` }}
    >
      {initials(startup.name)}
    </span>
  );
}
