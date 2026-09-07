import type { Milestone } from '@agentipo/shared';
import { Panel } from '@/components/ui/panel';
import { ProgressBar } from '@/components/ui/progress-bar';
import { bpsToPercent } from '@/lib/format';

export function Milestones({ milestones }: { milestones: Milestone[] }) {
  const total = milestones.reduce((sum, m) => sum + m.releaseBps, 0);
  return (
    <Panel eyebrow="escrow release" title="Milestones" action={<span className="font-mono text-[11px] text-muted">{bpsToPercent(total)} allocated</span>}>
      {milestones.length === 0 ? (
        <p className="text-xs text-muted">No milestones defined.</p>
      ) : (
        <ol className="flex flex-col gap-3">
          {milestones.map((milestone, index) => (
            <li key={`${index}-${milestone.title}`} className="flex items-center gap-3">
              <span className="font-mono text-[11px] text-muted">{String(index + 1).padStart(2, '0')}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm text-fg">{milestone.title}</p>
                  <span className="font-mono text-xs text-accent">{bpsToPercent(milestone.releaseBps)}</span>
                </div>
                <ProgressBar value={milestone.releaseBps / 100} className="mt-1.5" />
              </div>
            </li>
          ))}
        </ol>
      )}
    </Panel>
  );
}
