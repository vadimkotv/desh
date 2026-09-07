import { ERC8004_BASE_SEPOLIA, ERC8004_SEPOLIA, type Agent } from '@agentipo/shared';
import { Badge } from '@/components/ui/badge';
import { CopyButton } from '@/components/ui/copy-button';
import { ExternalLink } from '@/components/ui/external-link';
import { hashscanAccountUrl } from '@/lib/format';

const chainName = (chainId: number | null): string =>
  chainId === ERC8004_BASE_SEPOLIA.chainId ? 'base-sepolia' : chainId === ERC8004_SEPOLIA.chainId ? 'sepolia' : `chain ${chainId ?? '?'}`;

// Wallet + Hedera + ERC-8004 identity strip shared by list cards and detail.
export function AgentIdentity({ agent }: { agent: Agent }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 font-mono text-[11px] text-muted">
      <Badge tone={agent.walletKind === 'CIRCLE' ? 'info' : 'neutral'}>{agent.walletKind}</Badge>
      {agent.walletAddress ? (
        <span className="flex items-center gap-1">wallet <CopyButton value={agent.walletAddress} /></span>
      ) : (
        <span>wallet pending</span>
      )}
      {agent.hederaAccountId ? (
        <span className="flex items-center gap-1">
          hedera <ExternalLink href={hashscanAccountUrl(agent.hederaAccountId)}>{agent.hederaAccountId}</ExternalLink>
        </span>
      ) : (
        <span>hedera —</span>
      )}
      {agent.erc8004AgentId ? (
        <Badge tone="accent">ERC-8004 #{agent.erc8004AgentId} · {chainName(agent.erc8004ChainId)}</Badge>
      ) : (
        <Badge tone="neutral">ERC-8004 unregistered</Badge>
      )}
    </div>
  );
}
