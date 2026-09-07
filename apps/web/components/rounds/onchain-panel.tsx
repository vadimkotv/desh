import { ARC_TESTNET } from '@agentipo/shared';
import { Badge } from '@/components/ui/badge';
import { CopyButton } from '@/components/ui/copy-button';
import { ExternalLink } from '@/components/ui/external-link';
import { KeyValue, KeyValueList } from '@/components/ui/key-value';
import { Panel } from '@/components/ui/panel';
import type { OnchainRound } from '@/lib/api-types';
import { arcAddressUrl, usdc } from '@/lib/format';
import type { RoundDetail } from '@/lib/types';
import { MilestoneTimeline } from './milestone-timeline';

type OnchainPanelProps = { round: RoundDetail; onchain: OnchainRound | null };

export function OnchainPanel({ round, onchain }: OnchainPanelProps) {
  const live = Boolean(round.escrowAddress);
  return (
    <Panel
      eyebrow={`arc testnet · chain ${ARC_TESTNET.id}`}
      title="Escrow"
      tone={live ? 'accent' : 'default'}
      action={live ? <Badge tone="accent">LIVE · Arc</Badge> : <Badge tone="neutral">not deployed</Badge>}
    >
      <KeyValueList>
        <KeyValue label="escrow">
          {round.escrowAddress ? <CopyButton value={round.escrowAddress} /> : <span className="text-muted">—</span>}
        </KeyValue>
        <KeyValue label="onchain round id">{round.onchainRoundId ?? <span className="text-muted">pending</span>}</KeyValue>
        <KeyValue label="usdc">
          <CopyButton value={ARC_TESTNET.usdc} />
        </KeyValue>
        {onchain && (
          <>
            <KeyValue label="chain status">{onchain.status}</KeyValue>
            <KeyValue label="investors">{onchain.investorCount}</KeyValue>
            <KeyValue label="raised (chain)">{usdc(onchain.raisedUsdc)}</KeyValue>
          </>
        )}
        <KeyValue label="explorer">
          {round.escrowAddress ? <ExternalLink href={arcAddressUrl(round.escrowAddress)}>arcscan</ExternalLink> : <span className="text-muted">—</span>}
        </KeyValue>
      </KeyValueList>
      <p className="eyebrow mb-3 mt-4">milestone release</p>
      <MilestoneTimeline milestones={round.milestones} releasedCount={onchain?.releasedCount ?? 0} />
    </Panel>
  );
}
