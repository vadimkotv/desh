import { BadRequestException, Inject, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { AgentQueries } from '../../agents/application/agent-queries.usecase';
import { AUDIT_LOG, type AuditLog } from '../../audit/domain/audit.port';
import { SettlementRailResolver } from '../../settlement/application/settlement-rail.resolver';
import { ESCROW_READER, type EscrowReader } from '../../settlement/domain/escrow-reader.port';
import { INVESTMENT_REPOSITORY, type InvestmentRepository } from '../../settlement/domain/investment.repository';
import { RoundQueries } from '../../startups/application/round-queries.usecase';

export interface ClaimResult {
  agentId: string;
  roundId: string;
  claimedUsdc: number;
  txHash: string;
  chainId: number;
}

// The agent pulls its revenue-share returns from the escrow with its own key. The claimed
// amount is measured on-chain (claimedOf before/after) so Circle and local rails agree.
@Injectable()
export class ClaimReturnsUseCase {
  private readonly log = new Logger(ClaimReturnsUseCase.name);

  constructor(
    @Inject(ESCROW_READER) private readonly reader: EscrowReader | null,
    @Inject(INVESTMENT_REPOSITORY) private readonly investments: InvestmentRepository,
    @Inject(AUDIT_LOG) private readonly audit: AuditLog,
    private readonly rails: SettlementRailResolver,
    private readonly rounds: RoundQueries,
    private readonly agents: AgentQueries,
  ) {}

  async execute(agentId: string, roundId: string): Promise<ClaimResult> {
    if (!this.reader) throw new ServiceUnavailableException('Arc escrow is not configured');
    const agent = await this.agents.getRecord(agentId);
    const round = await this.rounds.getRound(roundId);
    if (round.onchainRoundId === null || !agent.walletAddress) throw new BadRequestException('nothing to claim: no escrow or wallet');

    const before = await this.reader.positionOf(round.onchainRoundId, agent.walletAddress);
    if (before.claimableUsdc <= 0) throw new BadRequestException('nothing to claim yet');

    const rail = this.rails.resolve(agent.walletKind);
    const wallet = { kind: agent.walletKind, address: agent.walletAddress, keyIndex: agent.keyIndex, circleWalletId: agent.circleWalletId };
    const tx = await rail.claim(wallet, round.onchainRoundId);
    if (!(await rail.waitForConfirmation(tx.txHash))) throw new Error(`claim reverted: ${tx.txHash}`);

    const after = await this.reader.positionOf(round.onchainRoundId, agent.walletAddress);
    const claimedUsdc = after.claimedUsdc - before.claimedUsdc;
    await this.investments.addClaimed(agent.id, roundId, claimedUsdc);
    await this.audit.record('RETURN_CLAIMED', { roundId, claimedUsdc, txHash: tx.txHash, chainId: tx.chainId, totalClaimedUsdc: after.claimedUsdc }, agent.id);
    this.log.log(`agent ${agent.name} claimed ${claimedUsdc} USDC from round ${round.onchainRoundId}`);
    return { agentId: agent.id, roundId, claimedUsdc, txHash: tx.txHash, chainId: tx.chainId };
  }
}
