import { Injectable, Logger } from '@nestjs/common';
import { SubmitInvestmentUseCase } from '../../settlement/application/submit-investment.usecase';
import { WalletBalanceQuery } from '../../settlement/application/wallet-balance.query';
import { evaluateSpend, type SpendVerdict } from '../../settlement/domain/spending-policy';
import type { RoundDetail } from '../../startups/domain/round.repository';
import type { AgentRecord } from '../domain/agent.repository';

// The one place the spending ceiling is computed. Both the live pipeline and a human
// approving a proposal go through it, so an approval can never settle an amount the
// mandate, the daily budget or the wallet no longer allows.
@Injectable()
export class SpendCeiling {
  private readonly log = new Logger(SpendCeiling.name);

  constructor(
    private readonly investments: SubmitInvestmentUseCase,
    private readonly balances: WalletBalanceQuery,
  ) {}

  async evaluate(agent: AgentRecord, round: RoundDetail, proposedUsdc?: number): Promise<SpendVerdict> {
    return evaluateSpend({
      mandate: agent.mandate,
      round,
      proposedUsdc: proposedUsdc ?? agent.mandate.maxTicketUsdc,
      spentTodayUsdc: await this.investments.spentToday(agent.id),
      walletBalanceUsdc: await this.balanceOf(agent),
    });
  }

  private async balanceOf(agent: AgentRecord): Promise<number | undefined> {
    if (!agent.walletAddress) return undefined;
    try {
      return await this.balances.usdcBalance(agent.walletAddress);
    } catch (err) {
      this.log.warn(`balance read failed for ${agent.walletAddress}: ${(err as Error).message}`);
      return undefined;
    }
  }
}
