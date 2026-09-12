import { Inject, Injectable } from '@nestjs/common';
import { entryValuation, type InvestorReturn, type RoundReturns } from '@agentipo/shared';
import { AgentQueries } from '../../agents/application/agent-queries.usecase';
import { ESCROW_READER, type EscrowReader } from '../../settlement/domain/escrow-reader.port';
import { INVESTMENT_REPOSITORY, type InvestmentRepository } from '../../settlement/domain/investment.repository';
import { RoundQueries } from '../../startups/application/round-queries.usecase';

type AgentRef = { id: string; name: string; walletAddress: string | null };

// Who is owed what after an exit: the DB tells us which agents invested, the chain tells
// us the truth about contributions, claimable and claimed amounts.
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
    const { raisedUsdc, proceedsUsdc } = round;
    const base = {
      roundId,
      onchainRoundId: round.onchainRoundId,
      status: round.status,
      equityBps: round.equityBps,
      raisedUsdc,
      entryValuationUsdc: entryValuation(raisedUsdc, round.equityBps),
      proceedsUsdc,
      multiple: raisedUsdc > 0 ? proceedsUsdc / raisedUsdc : 0,
    };
    if (!this.reader || round.onchainRoundId === null) return { ...base, investors: [] };

    const agentIds = [...new Set((await this.investments.confirmedByRound(roundId)).map((i) => i.agentId))];
    const agents = await Promise.all(agentIds.map((id) => this.agents.get(id)));
    const investors = await Promise.all(
      agents
        .filter((a) => a.walletAddress)
        .map((a) => this.position(round.onchainRoundId as number, base.multiple, a)),
    );
    return { ...base, investors };
  }

  private async position(onchainId: number, multiple: number, agent: AgentRef): Promise<InvestorReturn> {
    const p = await (this.reader as EscrowReader).positionOf(onchainId, agent.walletAddress as string);
    return {
      agentId: agent.id,
      agentName: agent.name,
      address: agent.walletAddress as string,
      contributionUsdc: p.contributionUsdc,
      claimableUsdc: p.claimableUsdc,
      claimedUsdc: p.claimedUsdc,
      proRataUsdc: p.claimableUsdc + p.claimedUsdc,
      multiple,
    };
  }
}
