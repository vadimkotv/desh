'use client';

import { useRouter } from 'next/navigation';
import { ActionButton } from '@/components/ui/action-button';
import { api } from '@/lib/api';

type RoundActionsProps = { roundId: string; startupId: string };

export function RoundActions({ roundId, startupId }: RoundActionsProps) {
  const router = useRouter();
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
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
        successText={(report) => (report && typeof report.score === 'number' ? `report ready · score ${Math.round(report.score)}` : 'report generated')}
        onSuccess={() => router.refresh()}
      />
    </div>
  );
}
