import type { DueDiligencePreview } from '@agentipo/shared';
import { Meter } from '@/components/charts/meter';
import { Ring } from '@/components/charts/ring';
import { Sparkline } from '@/components/charts/sparkline';
import { Panel } from '@/components/ui/panel';
import type { DdHistoryPoint } from '@/lib/api-types';
import { formatDate, ratioToPercent } from '@/lib/format';
import { DdReport } from './dd-report';

type DdSectionProps = { roundId: string; startupId: string; preview: DueDiligencePreview | null; history: DdHistoryPoint[] };

// Free-tier due diligence: score ring, coverage, summary, score history; then the
// client part that can (re)generate the report and unlock the findings radar.
export function DdSection({ roundId, startupId, preview, history }: DdSectionProps) {
  const series = [...history].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const scores = series.map((h) => h.score);
  const first = scores[0];
  const last = scores[scores.length - 1];
  return (
    <Panel eyebrow="due diligence · free tier" title="Report">
      {!preview ? (
        <p className="text-[12px] text-muted">No report yet. Refresh the data room, then generate a report to score this round.</p>
      ) : (
        <div className="grid gap-5 md:grid-cols-[auto_1fr_auto]">
          <Ring value={preview.score} size={104} stroke={9} label="score" />
          <div className="min-w-0">
            <p className="text-[13px] leading-relaxed text-fg">{preview.summary}</p>
            <div className="mt-3 flex items-center justify-between font-mono text-[10.5px] text-muted">
              <span>data coverage</span>
              <span className="text-fg">{ratioToPercent(preview.dataCoverage)}</span>
            </div>
            <Meter value={preview.dataCoverage * 100} tone="info" className="mt-1" />
            <p className="mt-2 font-mono text-[10.5px] text-dim">generated {formatDate(preview.createdAt)} · report {preview.id.slice(0, 8)}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="eyebrow">score history</span>
            <Sparkline values={scores} min={0} max={100} width={140} height={44} ariaLabel={`score history, ${scores.length} reports`} />
            <span className="num text-[10.5px] text-muted">
              {scores.length} report{scores.length === 1 ? '' : 's'}
              {first !== undefined && last !== undefined && scores.length > 1 && last !== first && (
                <span className={last >= first ? 'text-accent' : 'text-danger'}> · {last >= first ? '▲' : '▼'} {Math.abs(last - first).toFixed(1)}</span>
              )}
            </span>
          </div>
        </div>
      )}
      <DdReport roundId={roundId} startupId={startupId} />
    </Panel>
  );
}
