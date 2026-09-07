import type { Health } from '@/lib/api-types';
import { healthPills } from '@/lib/health';
import { StatusPill } from '@/components/ui/pill';

type StatusBarProps = { health: Health | null };

// Top bar of the command center: wordmark line + honest network/feature pills.
export function StatusBar({ health }: StatusBarProps) {
  const pills = healthPills(health?.features ?? null);
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className="eyebrow text-accent">
          <span className="live-dot mr-1.5">●</span>command center
        </p>
        <h1 className="mt-1 max-w-xl text-lg font-semibold leading-snug tracking-tight text-bright sm:text-xl">
          Agents are buying data, deciding and settling <span className="text-accent">right now</span>.
        </h1>
        <p className="mt-1 max-w-2xl text-[12.5px] text-muted">
          Mandate-bound investor agents pay per query over x402 on Hedera, reason over Graph-indexed signals, and
          settle USDC into milestone escrow on Arc. Every step streams below.
        </p>
      </div>
      <div className="flex flex-wrap gap-1.5" aria-label="integration status">
        {pills.map((pill) => (
          <StatusPill key={pill.label} {...pill} />
        ))}
      </div>
    </div>
  );
}
