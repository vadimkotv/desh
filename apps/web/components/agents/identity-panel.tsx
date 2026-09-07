'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ERC8004_BASE_SEPOLIA, ERC8004_SEPOLIA, type Agent } from '@agentipo/shared';
import { ActionButton } from '@/components/ui/action-button';
import { Badge } from '@/components/ui/badge';
import { CopyButton } from '@/components/ui/copy-button';
import { ExternalLink } from '@/components/ui/external-link';
import { KeyValue, KeyValueList } from '@/components/ui/key-value';
import { Panel } from '@/components/ui/panel';
import { useWalletBalance } from '@/hooks/use-wallet-balance';
import { api } from '@/lib/api';
import { hashscanAccountUrl, num } from '@/lib/format';

const chainName = (chainId: number | null): string =>
  chainId === ERC8004_BASE_SEPOLIA.chainId ? 'base-sepolia' : chainId === ERC8004_SEPOLIA.chainId ? 'sepolia' : `chain ${chainId ?? '?'}`;

// Wallet + balance + Hedera + ERC-8004 identity, with the register action.
export function IdentityPanel({ agent }: { agent: Agent }) {
  const router = useRouter();
  const [refresh, setRefresh] = useState(0);
  const balance = useWalletBalance(agent.walletAddress, refresh);
  return (
    <Panel
      eyebrow="identity"
      title="Wallet & registry"
      action={
        agent.erc8004AgentId ? (
          <Badge tone="agent">ERC-8004 #{agent.erc8004AgentId} · {chainName(agent.erc8004ChainId)}</Badge>
        ) : (
          <ActionButton
            label="Register identity"
            pendingLabel="Registering…"
            variant="agent"
            size="xs"
            run={() => api.registerIdentity(agent.id)}
            successText={(a) => (a?.erc8004AgentId ? `registered #${a.erc8004AgentId}` : 'registered')}
            onSuccess={() => router.refresh()}
          />
        )
      }
    >
      <KeyValueList>
        <KeyValue label="wallet">
          {agent.walletAddress ? <CopyButton value={agent.walletAddress} chars={6} /> : <span className="text-muted">pending</span>}
        </KeyValue>
        <KeyValue label="usdc on arc">
          <button type="button" onClick={() => setRefresh((n) => n + 1)} className="hover:text-accent" title="refresh balance">
            {balance.status === 'loading' ? <span className="live-dot text-dim">…</span> : balance.usdc !== null ? <span className="text-bright">{num(balance.usdc)} USDC</span> : <span className="text-dim">unavailable</span>}
            <span className="ml-1 text-dim">↻</span>
          </button>
        </KeyValue>
        <KeyValue label="wallet kind">
          <Badge tone={agent.walletKind === 'CIRCLE' ? 'info' : 'neutral'}>{agent.walletKind}</Badge>
        </KeyValue>
        <KeyValue label="hedera account">
          {agent.hederaAccountId ? <ExternalLink href={hashscanAccountUrl(agent.hederaAccountId)}>{agent.hederaAccountId}</ExternalLink> : <span className="text-muted">—</span>}
        </KeyValue>
        <KeyValue label="erc-8004">
          {agent.erc8004AgentId ? `#${agent.erc8004AgentId} on ${chainName(agent.erc8004ChainId)}` : <span className="text-muted">unregistered</span>}
        </KeyValue>
        <KeyValue label="owner">
          <CopyButton value={agent.ownerAddress} />
        </KeyValue>
      </KeyValueList>
    </Panel>
  );
}
