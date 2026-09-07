import { Inject, Injectable, Logger } from '@nestjs/common';
import type { Investment } from '@agentipo/shared';
import { INVESTMENT_REPOSITORY, type InvestmentRepository } from '../domain/investment.repository';
import type { AgentWalletRef } from '../domain/settlement.port';
import { SettlementRailResolver } from './settlement-rail.resolver';

export interface SubmitInvestmentCommand {
  decisionId: string;
  agentId: string;
  roundId: string;
  onchainRoundId: number | null;
  wallet: AgentWalletRef;
  amountUsdc: number;
}

// Persists the intent first, then settles on Arc. Failures are recorded, never thrown
// past this boundary: an agent run must not abort because one settlement reverted.
@Injectable()
export class SubmitInvestmentUseCase {
  private readonly log = new Logger(SubmitInvestmentUseCase.name);

  constructor(
    @Inject(INVESTMENT_REPOSITORY) private readonly investments: InvestmentRepository,
    private readonly rails: SettlementRailResolver,
  ) {}

  async execute(cmd: SubmitInvestmentCommand): Promise<Investment> {
    const investment = await this.investments.create({
      decisionId: cmd.decisionId,
      roundId: cmd.roundId,
      agentId: cmd.agentId,
      amountUsdc: cmd.amountUsdc,
      chainId: 0,
    });
    if (cmd.onchainRoundId === null) return this.fail(investment, 'round has no on-chain escrow id');

    try {
      const rail = this.rails.resolve(cmd.wallet.kind);
      const tx = await rail.invest({ wallet: cmd.wallet, onchainRoundId: cmd.onchainRoundId, amountUsdc: cmd.amountUsdc });
      await this.investments.setSubmitted(investment.id, tx.txHash);
      const ok = await rail.waitForConfirmation(tx.txHash);
      await this.investments.setStatus(investment.id, ok ? 'CONFIRMED' : 'FAILED', ok ? undefined : 'tx reverted');
      return { ...investment, txHash: tx.txHash, chainId: tx.chainId, status: ok ? 'CONFIRMED' : 'FAILED' };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.log.error(`settlement failed for decision ${cmd.decisionId}: ${message}`);
      return this.fail(investment, message.slice(0, 500));
    }
  }

  spentToday(agentId: string): Promise<number> {
    return this.investments.spentSince(agentId, new Date(Date.now() - 24 * 60 * 60 * 1000));
  }

  private async fail(investment: Investment, error: string): Promise<Investment> {
    await this.investments.setStatus(investment.id, 'FAILED', error);
    return { ...investment, status: 'FAILED' };
  }
}
