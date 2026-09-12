'use client';

import { useRouter } from 'next/navigation';
import { ActionButton } from '@/components/ui/action-button';
import { api } from '@/lib/api';

export function RefreshDataButton({ startupId }: { startupId: string }) {
  const router = useRouter();
  return (
    <ActionButton
      label="Refresh"
      pendingLabel="Refreshing…"
      run={() => api.refreshDataRoom(startupId)}
      successText={() => 'signals refreshed'}
      onSuccess={() => router.refresh()}
    />
  );
}
