import { Inject, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import type { RoundStatus } from '@agentipo/shared';
import { AUDIT_LOG, type AuditLog } from '../../audit/domain/audit.port';
import { ESCROW_OPERATOR, type EscrowOperator } from '../../settlement/domain/escrow-operator.port';
import { ESCROW_READER, type EscrowReader, type OnchainRoundStatus } from '../../settlement/domain/escrow-reader.port';
import { RoundQueries } from '../../startups/application/round-queries.usecase';
import type { RoundDetail } from '../../startups/domain/round.repository';
import { DISTRIBUTION_REPOSITORY, type DistributionRepository } from '../domain/distribution.repository';

const STATUS: Record<OnchainRoundStatus, RoundStatus> = { Open: 'OPEN', Funded: 'FUNDED', Failed: 'FAILED', Closed: 'CLOSED', Repaid: 'REPAID' };

// Platform-side lifecycle: finalize → release milestones → distribute revenue.
// Every action is followed by a chain → DB sync so the API never invents state.
@Injectable()
export class RoundLifecycleUseCase {
  private readonly log = new Logger(RoundLifecycleUseCase.name);

  constructor(
    @Inject(ESCROW_OPERATOR) private readonly operator: EscrowOperator | null,
    @Inject(ESCROW_READER) private readonly reader: EscrowReader | null,
    @Inject(AUDIT_LOG) private readonly audit: AuditLog,
    @Inject(DISTRIBUTION_REPOSITORY) private readonly distributions: DistributionRepository,
    private readonly rounds: RoundQueries,
  ) {}

  async finalize(roundId: string): Promise<RoundDetail> {
    const { round, onchainId } = await this.prepare(roundId);
    const txHash = await this.op().finalize(onchainId);
    await this.audit.record('ROUND_FINALIZED', { roundId, onchainId, txHash, raisedUsdc: round.raisedUsdc });
    return this.sync(roundId);
  }

  async releaseMilestone(roundId: string): Promise<RoundDetail> {
    const { round, onchainId } = await this.prepare(roundId);
    const txHash = await this.op().releaseMilestone(onchainId);
    const synced = await this.sync(roundId);
    const index = (await this.rd().getRound(onchainId)).releasedCount - 1;
    await this.audit.record('MILESTONE_RELEASED', { roundId, onchainId, txHash, index, milestone: round.milestones[index]?.title });
    return synced;
  }

  async distribute(roundId: string, amountUsdc: number): Promise<RoundDetail> {
    const { onchainId } = await this.prepare(roundId);
    const txHash = await this.op().distribute(onchainId, amountUsdc);
    await this.distributions.create({ roundId, amountUsdc, txHash, source: 'platform-revenue-router' });
    const synced = await this.sync(roundId);
    await this.audit.record('REVENUE_DISTRIBUTED', { roundId, onchainId, txHash, amountUsdc, distributedUsdc: synced.distributedUsdc, status: synced.status });
    this.log.log(`distributed ${amountUsdc} USDC into round ${onchainId} → ${synced.distributedUsdc} total`);
    return synced;
  }

  async sync(roundId: string): Promise<RoundDetail> {
    const { onchainId } = await this.prepare(roundId);
    const chain = await this.rd().getRound(onchainId);
    await this.rounds.syncOnchain(roundId, { status: STATUS[chain.status], raisedUsdc: chain.raisedUsdc, distributedUsdc: chain.distributedUsdc });
    return this.rounds.getRound(roundId);
  }

  private async prepare(roundId: string): Promise<{ round: RoundDetail; onchainId: number }> {
    const round = await this.rounds.getRound(roundId);
    if (round.onchainRoundId === null) throw new ServiceUnavailableException('round has no on-chain escrow');
    return { round, onchainId: round.onchainRoundId };
  }

  private op(): EscrowOperator {
    if (!this.operator) throw new ServiceUnavailableException('Arc escrow operator is not configured');
    return this.operator;
  }

  private rd(): EscrowReader {
    if (!this.reader) throw new ServiceUnavailableException('Arc escrow reader is not configured');
    return this.reader;
  }
}
