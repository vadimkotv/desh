import { Inject, Injectable } from '@nestjs/common';
import type { InvestorReturn, RoundReturns } from '@agentipo/shared';
import { AgentQueries } from '../../agents/application/agent-queries.usecase';
import { ESCROW_READER, type EscrowReader } from '../../settlement/domain/escrow-reader.port';
import { INVESTMENT_REPOSITORY, type InvestmentRepository } from '../../settlement/domain/investment.repository';
import { RoundQueries } from '../../startups/application/round-queries.usecase';

// Who is owed what: DB tells us which agents invested, the chain tells us the truth
// about contributions, claimable and claimed amounts.
@Injectable()
export class RoundReturnsQuery {
  constructor(
    @Inject(ESCROW_READER) private readonly reader: EscrowReader | null,
    @Inject(INVESTMENT_REPOSITORY) private readonly investments: InvestmentRepository,
    private readonly rounds: RoundQueries,
    private readonly agents: AgentQueries,
  ) {}

  async execute(roundId: string): Promise<RoundReturns> {
    const round = await this.rounds.getRound(roundId);
    const capUsdc = (round.raisedUsdc * round.returnCapBps) / 10_000;
    const base = {
      roundId,
      onchainRoundId: round.onchainRoundId,
      status: round.status,
      returnCapBps: round.returnCapBps,
      raisedUsdc: round.raisedUsdc,
      capUsdc,
      distributedUsdc: round.distributedUsdc,
      repaidShare: capUsdc > 0 ? Math.min(1, round.distributedUsdc / capUsdc) : 0,
    };
    if (!this.reader || round.onchainRoundId === null) return { ...base, investors: [] };

    const agentIds = [...new Set((await this.investments.confirmedByRound(roundId)).map((i) => i.agentId))];
    const agents = await Promise.all(agentIds.map((id) => this.agents.get(id)));
    const investors = await Promise.all(
      agents.filter((a) => a.walletAddress).map((a) => this.position(round.onchainRoundId as number, round.returnCapBps, a)),
    );
    return { ...base, investors };
  }

  private async position(onchainId: number, capBps: number, agent: { id: string; name: string; walletAddress: string | null }): Promise<InvestorReturn> {
    const p = await (this.reader as EscrowReader).positionOf(onchainId, agent.walletAddress as string);
    return {
      agentId: agent.id,
      agentName: agent.name,
      address: agent.walletAddress as string,
      contributionUsdc: p.contributionUsdc,
      claimableUsdc: p.claimableUsdc,
      claimedUsdc: p.claimedUsdc,
      expectedUsdc: (p.contributionUsdc * capBps) / 10_000,
    };
  }
}
