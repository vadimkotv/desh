import type { Milestone } from '@agentipo/shared';
import { bpsToPercent } from '@/lib/format';

type MilestoneTimelineProps = { milestones: Milestone[]; releasedCount?: number };

// Vertical timeline of escrow milestones; released ones light up in accent.
export function MilestoneTimeline({ milestones, releasedCount = 0 }: MilestoneTimelineProps) {
  if (milestones.length === 0) return <p className="text-[11px] text-muted">No milestones defined.</p>;
  return (
    <ol className="relative ml-2 flex flex-col gap-3 border-l border-line pl-4">
      {milestones.map((milestone, index) => {
        const released = index < releasedCount;
        return (
          <li key={`${index}-${milestone.title}`} className="relative">
            <span
              className={`absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full border-2 ${released ? 'border-accent bg-accent' : 'border-line-strong bg-panel'}`}
              aria-hidden
            />
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-[12.5px] text-fg">
                <span className="mr-1.5 font-mono text-[10px] text-dim">{String(index + 1).padStart(2, '0')}</span>
                {milestone.title}
              </p>
              <span className="num text-[11px] text-accent">{bpsToPercent(milestone.releaseBps)}</span>
            </div>
            <p className="font-mono text-[10px] text-dim">{released ? 'released to founder' : 'locked in escrow'}</p>
          </li>
        );
      })}
    </ol>
  );
}
