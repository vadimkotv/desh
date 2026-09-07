import type { Mandate } from '@agentipo/shared';
import { Badge } from '@/components/ui/badge';
import { Panel } from '@/components/ui/panel';
import { MandateBars } from './mandate-bars';

const riskTone = { conservative: 'info', balanced: 'accent', aggressive: 'amber' } as const;

export function MandateCard({ mandate }: { mandate: Mandate }) {
  return (
    <Panel eyebrow="human intent · the only input" title="Mandate" tone="agent" action={<Badge tone={riskTone[mandate.riskTolerance]}>{mandate.riskTolerance}</Badge>}>
      <blockquote className="border-l-2 border-agent/50 pl-3 text-[13px] italic leading-relaxed text-fg">“{mandate.thesis}”</blockquote>
      <div className="mt-3 flex flex-wrap gap-1">
        {mandate.sectors.map((sector) => (
          <Badge key={sector} tone="info">{sector}</Badge>
        ))}
      </div>
      <div className="mt-4">
        <MandateBars mandate={mandate} compact />
      </div>
    </Panel>
  );
}
