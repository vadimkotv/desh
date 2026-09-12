'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { AccessRequest } from '@agentipo/shared';
import { ActionButton } from '@/components/ui/action-button';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { formatDate, shortAddress } from '@/lib/format';

const tone = { PENDING: 'amber', GRANTED: 'accent', DENIED: 'neutral' } as const;

// The founder's side of gating: who is asking, whose agent it is, and what its mandate
// says — enough to decide without leaving the page.
export function AccessInbox({ requests }: { requests: AccessRequest[] }) {
  const router = useRouter();
  if (requests.length === 0) return null;

  return (
    <div className="mt-4 border-t border-line pt-3">
      <p className="eyebrow mb-2">access requests</p>
      <ul className="flex flex-col gap-2">
        {requests.map((request) => (
          <li key={request.id} className="flex flex-col gap-1.5 rounded-md border border-line bg-raised/50 p-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="flex flex-wrap items-center gap-2">
                <Badge tone={tone[request.status]}>{request.status.toLowerCase()}</Badge>
                <Link href={`/agents/${request.agentId}`} className="font-mono text-[11.5px] text-agent hover:underline">
                  {request.agentName ?? shortAddress(request.agentId)}
                </Link>
                {request.ownerAddress && (
                  <span className="font-mono text-[10px] text-muted">owner {shortAddress(request.ownerAddress)}</span>
                )}
                <span className="font-mono text-[10px] text-dim">{formatDate(request.createdAt)}</span>
              </span>
              {request.status === 'PENDING' && (
                <span className="flex items-center gap-2">
                  <ActionButton label="Open data" pendingLabel="Opening…" variant="primary" size="xs" run={() => api.grantAccess(request.id)} successText={() => 'opened'} onSuccess={() => router.refresh()} />
                  <ActionButton label="Deny" pendingLabel="Denying…" size="xs" run={() => api.denyAccess(request.id)} successText={() => 'denied'} onSuccess={() => router.refresh()} />
                </span>
              )}
            </div>
            {request.thesis && (
              <p className="text-[11.5px] italic leading-relaxed text-muted">“{request.thesis}”</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
