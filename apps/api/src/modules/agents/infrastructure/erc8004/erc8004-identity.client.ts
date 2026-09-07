import { Injectable, Logger } from '@nestjs/common';
import { createPublicClient, createWalletClient, decodeEventLog, http } from 'viem';
import { baseSepolia, sepolia } from 'viem/chains';
import { AppConfig } from '../../../../config/app-config';
import { AgentKeyDerivation } from '../../../settlement/infrastructure/keys/agent-key.derivation';
import type { AgentRecord, IdentityRef } from '../../domain/agent.repository';
import type { AgentIdentity } from '../../domain/identity.port';
import { identityRegistryAbi } from './identity-registry.abi';

// The agent registers itself (signs with its own key) so ownerOf(agentId) is the agent wallet.
// The resulting ERC-721 id is what the Agent0 subgraph indexes and what reputation attaches to.
@Injectable()
export class Erc8004IdentityClient implements AgentIdentity {
  private readonly log = new Logger(Erc8004IdentityClient.name);

  constructor(
    private readonly config: AppConfig,
    private readonly keys: AgentKeyDerivation,
  ) {}

  async register(agent: AgentRecord, agentURI: string): Promise<IdentityRef> {
    const { ERC8004_RPC_URL, ERC8004_CHAIN_ID, ERC8004_IDENTITY_REGISTRY } = this.config.env;
    const chain = ERC8004_CHAIN_ID === baseSepolia.id ? baseSepolia : sepolia;
    const transport = http(ERC8004_RPC_URL);
    const account = this.keys.account(agent.keyIndex);
    const wallet = createWalletClient({ account, chain, transport });
    const publicClient = createPublicClient({ chain, transport });
    const registry = ERC8004_IDENTITY_REGISTRY as `0x${string}`;

    const txHash = await wallet.writeContract({
      address: registry, abi: identityRegistryAbi, functionName: 'register', args: [agentURI],
    });
    this.log.log(`ERC-8004 register tx ${txHash} for agent ${agent.id}`);
    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash, timeout: 120_000 });
    if (receipt.status !== 'success') throw new Error(`ERC-8004 register reverted: ${txHash}`);

    for (const log of receipt.logs) {
      if (log.address.toLowerCase() !== registry.toLowerCase()) continue;
      try {
        const ev = decodeEventLog({ abi: identityRegistryAbi, data: log.data, topics: log.topics });
        if (ev.eventName === 'Registered') {
          return { agentId: ev.args.agentId.toString(), chainId: chain.id, txHash };
        }
      } catch {
        /* other event */
      }
    }
    throw new Error('Registered event not found');
  }
}
