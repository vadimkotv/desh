import type { DueDiligenceReport } from '@agentipo/shared';
import { Meter } from '@/components/charts/meter';
import { Ring } from '@/components/charts/ring';
import { Sparkline } from '@/components/charts/sparkline';
import { Panel } from '@/components/ui/panel';
import type { DdHistoryPoint } from '@/lib/api-types';
import { formatDate, ratioToPercent } from '@/lib/format';
import { FindingsRadar } from './findings-radar';
import { RefreshDataButton } from './refresh-data-button';

type DdSectionProps = { startupId: string; report: DueDiligenceReport | null; history: DdHistoryPoint[] };

function ReportSummary({
  report,
  history,
}: {
  report: DueDiligenceReport;
  history: DdHistoryPoint[];
}) {
  const scores = [...history]
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map((item) => item.score);
  const first = scores[0];
  const last = scores.at(-1);
  return (
    <div className="grid gap-5 md:grid-cols-[auto_1fr_auto]">
      <Ring value={report.score} size={104} stroke={9} label="score" />
      <div className="min-w-0">
        <p className="text-[13px] leading-relaxed text-fg">{report.summary}</p>
        <div className="mt-3 flex items-center justify-between font-mono text-[10.5px] text-muted">
          <span>data coverage</span>
          <span className="text-fg">{ratioToPercent(report.dataCoverage)}</span>
        </div>
        <Meter value={report.dataCoverage * 100} tone="info" className="mt-1" />
        <p className="mt-2 font-mono text-[10.5px] text-dim">
          researched {formatDate(report.createdAt)} · report {report.id.slice(0, 8)}
        </p>
      </div>
      <div className="flex flex-col items-end gap-1">
        <span className="eyebrow">score history</span>
        <Sparkline
          values={scores}
          min={0}
          max={100}
          width={140}
          height={44}
          ariaLabel={`score history, ${scores.length} reports`}
        />
        <span className="num text-[10.5px] text-muted">
          {scores.length} report{scores.length === 1 ? '' : 's'}
          {first !== undefined && last !== undefined && scores.length > 1 && last !== first && (
            <span className={last >= first ? 'text-accent' : 'text-danger'}>
              {' '}
              · {last >= first ? '▲' : '▼'} {Math.abs(last - first).toFixed(1)}
            </span>
          )}
        </span>
      </div>
    </div>
  );
}

export function DdSection({ startupId, report, history }: DdSectionProps) {
  return (
    <Panel eyebrow="due diligence · agent research" title="Report" action={<RefreshDataButton startupId={startupId} />}>
      {!report ? (
        <p className="text-[12px] text-muted">
          Waiting for agent research. A matching running agent will generate the report
          automatically.
        </p>
      ) : (
        <div className="flex flex-col gap-5">
          <ReportSummary report={report} history={history} />
          <div className="border-t border-line pt-5">
            <FindingsRadar report={report} />
          </div>
        </div>
      )}
    </Panel>
  );
}
