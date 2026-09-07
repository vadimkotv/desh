import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import type { CreateAgent } from '@agentipo/shared';
import { AUDIT_LOG, type AuditLog } from '../../audit/domain/audit.port';
import { CircleWalletFactory } from '../../settlement/infrastructure/circle/circle-wallet.factory';
import { CircleClientProvider } from '../../settlement/infrastructure/circle/circle-client';
import { AgentKeyDerivation } from '../../settlement/infrastructure/keys/agent-key.derivation';
import { AGENT_REPOSITORY, type AgentRecord, type AgentRepository } from '../domain/agent.repository';
import { HederaAccountFactory } from '../infrastructure/hedera/hedera-account.factory';

// Provisions everything an agent needs to act: an Arc wallet (local HD key or Circle
// developer-controlled wallet) and a Hedera account for paying x402 invoices.
@Injectable()
export class CreateAgentUseCase {
  private readonly log = new Logger(CreateAgentUseCase.name);

  constructor(
    @Inject(AGENT_REPOSITORY) private readonly agents: AgentRepository,
    @Inject(AUDIT_LOG) private readonly audit: AuditLog,
    private readonly keys: AgentKeyDerivation,
    private readonly circle: CircleClientProvider,
    private readonly circleWallets: CircleWalletFactory,
    private readonly hederaAccounts: HederaAccountFactory,
  ) {}

  async execute(input: CreateAgent): Promise<AgentRecord> {
    this.assertProvisionable(input);
    let agent = await this.agents.create(input);
    agent = await this.provisionWallet(agent);
    agent = await this.provisionHedera(agent);
    await this.audit.record(
      'AGENT_REGISTERED',
      { name: agent.name, walletKind: agent.walletKind, walletAddress: agent.walletAddress, hederaAccountId: agent.hederaAccountId },
      agent.id,
    );
    return agent;
  }

  private assertProvisionable(input: CreateAgent): void {
    if (input.walletKind === 'CIRCLE' && !this.circle.enabled) {
      throw new BadRequestException('Circle wallets are not configured (CIRCLE_API_KEY / ENTITY_SECRET / WALLET_SET_ID)');
    }
    if (input.walletKind === 'LOCAL_KEY' && !this.keys.enabled) {
      throw new BadRequestException('AGENT_MASTER_MNEMONIC is not configured; cannot derive a local key');
    }
  }

  private async provisionWallet(agent: AgentRecord): Promise<AgentRecord> {
    if (agent.walletKind === 'CIRCLE') {
      const w = await this.circleWallets.create(agent.name);
      return this.agents.setWallet(agent.id, { walletAddress: w.address, circleWalletId: w.walletId });
    }
    const address = this.keys.account(agent.keyIndex).address;
    return this.agents.setWallet(agent.id, { walletAddress: address });
  }

  private async provisionHedera(agent: AgentRecord): Promise<AgentRecord> {
    if (!this.hederaAccounts.enabled || !this.keys.enabled) return agent;
    try {
      const accountId = await this.hederaAccounts.create(this.keys.privateKeyHex(agent.keyIndex));
      return await this.agents.setHederaAccount(agent.id, accountId);
    } catch (err) {
      this.log.warn(`Hedera account provisioning failed for ${agent.id}: ${(err as Error).message}`);
      return agent;
    }
  }
}
