import { ARC_TESTNET } from '@agentipo/shared';
import { CopyButton } from '@/components/ui/copy-button';
import { ExternalLink } from '@/components/ui/external-link';
import { KeyValue, KeyValueList } from '@/components/ui/key-value';
import { Panel } from '@/components/ui/panel';
import { arcAddressUrl } from '@/lib/format';
import type { RoundDetail } from '@/lib/types';

export function OnchainPanel({ round }: { round: RoundDetail }) {
  return (
    <Panel eyebrow={`arc testnet · chain ${ARC_TESTNET.id}`} title="On-chain escrow">
      <KeyValueList>
        <KeyValue label="escrow">
          {round.escrowAddress ? <CopyButton value={round.escrowAddress} /> : <span className="text-muted">not deployed</span>}
        </KeyValue>
        <KeyValue label="onchain round id">
          {round.onchainRoundId ?? <span className="text-muted">pending</span>}
        </KeyValue>
        <KeyValue label="usdc">
          <CopyButton value={ARC_TESTNET.usdc} />
        </KeyValue>
        <KeyValue label="explorer">
          {round.escrowAddress ? (
            <ExternalLink href={arcAddressUrl(round.escrowAddress)}>arcscan</ExternalLink>
          ) : (
            <span className="text-muted">—</span>
          )}
        </KeyValue>
      </KeyValueList>
    </Panel>
  );
}
