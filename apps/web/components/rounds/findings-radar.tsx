import type { DueDiligenceReport, Finding } from '@agentipo/shared';
import { Radar } from '@/components/charts/radar';
import { Badge, scoreColor, type BadgeTone } from '@/components/ui/badge';

const verdictTone: Record<Finding['verdict'], BadgeTone> = { strong: 'accent', ok: 'info', weak: 'amber', unknown: 'neutral' };

// Radar over finding categories + the findings list with verdict pills. The
// radar's axis label carries the weight so the reader sees which axes count.
export function FindingsRadar({ report }: { report: DueDiligenceReport }) {
  const axes = report.findings.map((f) => ({ label: f.category, value: f.score, weight: f.weight, tone: scoreColor(f.score) }));
  return (
    <div className="rise-in grid gap-4 lg:grid-cols-[auto_1fr]">
      <div className="flex flex-col items-center gap-1">
        <Radar axes={axes} size={300} />
        <p className="font-mono text-[10px] text-dim">score per category · w = weight</p>
      </div>
      <ol className="flex flex-col divide-y divide-line">
        {report.findings.map((finding) => (
          <li key={finding.category} className="flex items-start gap-3 py-2">
            <span className="num w-8 shrink-0 text-right text-[13px] font-semibold text-bright">{Math.round(finding.score)}</span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-[11px] uppercase tracking-wider text-fg">{finding.category}</span>
                <Badge tone={verdictTone[finding.verdict]}>{finding.verdict}</Badge>
                <span className="font-mono text-[10px] text-dim">weight {Math.round(finding.weight * 100)}%</span>
              </div>
              <p className="mt-0.5 text-[12px] leading-relaxed text-muted">{finding.rationale}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
