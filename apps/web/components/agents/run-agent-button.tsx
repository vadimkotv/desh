'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { Decision } from '@agentipo/shared';
import { ActionButton } from '@/components/ui/action-button';
import { api } from '@/lib/api';
import { DecisionCard } from './decision-card';

// Triggers the full pipeline (buy data → decide → bound → settle → audit) and
// shows the decisions returned by this run before the feed refreshes.
export function RunAgentButton({ agentId }: { agentId: string }) {
  const router = useRouter();
  const [latest, setLatest] = useState<Decision[]>([]);
  return (
    <div className="flex flex-col gap-3">
      <ActionButton
        label="▶ Run agent"
        pendingLabel="Buying data · deciding · settling…"
        variant="primary"
        run={() => api.runAgent(agentId)}
        successText={(decisions) => `${decisions.length} decision${decisions.length === 1 ? '' : 's'} this run`}
        onSuccess={(decisions) => {
          setLatest(decisions);
          router.refresh();
        }}
      />
      {latest.length > 0 && (
        <div className="rounded-lg border border-accent/30 p-3">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-accent">this run</p>
          <div className="flex flex-col gap-2">
            {latest.map((decision) => (
              <DecisionCard key={decision.id} decision={decision} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
