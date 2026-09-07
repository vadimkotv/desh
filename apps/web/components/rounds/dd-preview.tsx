import type { DueDiligencePreview } from '@agentipo/shared';
import { Panel } from '@/components/ui/panel';
import { ProgressBar } from '@/components/ui/progress-bar';
import { formatDate, ratioToPercent } from '@/lib/format';
import { ScoreGauge } from './score-gauge';

type DdPreviewProps = { preview: DueDiligencePreview | null };

export function DdPreview({ preview }: DdPreviewProps) {
  return (
    <Panel eyebrow="free tier" title="Due-diligence preview">
      {!preview ? (
        <p className="text-xs text-muted">
          No report yet. Refresh the data room, then generate a report to score this round.
        </p>
      ) : (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <ScoreGauge score={preview.score} />
          <div className="min-w-0 flex-1">
            <p className="text-sm leading-relaxed text-fg">{preview.summary}</p>
            <div className="mt-3">
              <div className="flex items-center justify-between font-mono text-[11px] text-muted">
                <span>data coverage</span>
                <span className="text-fg">{ratioToPercent(preview.dataCoverage)}</span>
              </div>
              <ProgressBar value={preview.dataCoverage * 100} tone="info" className="mt-1" />
            </div>
            <p className="mt-2 font-mono text-[11px] text-muted">generated {formatDate(preview.createdAt)}</p>
          </div>
        </div>
      )}
    </Panel>
  );
}
