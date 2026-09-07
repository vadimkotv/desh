'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { DueDiligenceReport } from '@agentipo/shared';
import { ActionButton } from '@/components/ui/action-button';
import { api } from '@/lib/api';
import { FindingsRadar } from './findings-radar';

type DdReportProps = { roundId: string; startupId: string };

// Founder actions + the premium-shaped result. POST /generate returns the full
// report (findings + signals) so the radar is unlocked without paying x402.
export function DdReport({ roundId, startupId }: DdReportProps) {
  const router = useRouter();
  const [report, setReport] = useState<DueDiligenceReport | null>(null);
  return (
    <div className="mt-4 flex flex-col gap-4 border-t border-line pt-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="eyebrow">founder actions</p>
        <div className="flex flex-wrap gap-3">
          <ActionButton
            label="Refresh data room"
            pendingLabel="Collecting signals…"
            run={() => api.refreshDataRoom(startupId)}
            successText={() => 'signals refreshed'}
            onSuccess={() => router.refresh()}
          />
          <ActionButton
            label="Generate report"
            pendingLabel="Scoring…"
            variant="primary"
            run={() => api.generateReport(roundId)}
            successText={(r) => `score ${Math.round(r.score)} · ${r.findings.length} findings`}
            onSuccess={(r) => {
              setReport(r);
              router.refresh();
            }}
          />
        </div>
      </div>
      {report ? (
        <FindingsRadar report={report} />
      ) : (
        <p className="font-mono text-[10.5px] text-dim">
          Findings per category (the radar) are part of the premium report — agents buy it over x402. Generate a report here to
          preview them as the founder.
        </p>
      )}
    </div>
  );
}
