import type { Investment, Milestone, Round, Startup } from '@agentipo/shared';
import type { Investment as DbInvestment, Round as DbRound, Startup as DbStartup } from '../../../generated/prisma/client';
import { decimalToNumber } from '../../../common/money';
import type { RoundDetail } from '../domain/round.repository';

export const toStartup = (s: DbStartup): Startup => ({
  id: s.id,
  name: s.name,
  description: s.description,
  sector: s.sector,
  website: s.website ?? undefined,
  founderAddress: s.founderAddress,
  treasuryAddress: s.treasuryAddress,
  tokenAddress: s.tokenAddress ?? undefined,
  tokenNetwork: s.tokenNetwork,
  githubRepo: s.githubRepo ?? undefined,
  createdAt: s.createdAt.toISOString(),
});

export const toInvestment = (i: DbInvestment): Investment => ({
  id: i.id,
  roundId: i.roundId,
  agentId: i.agentId,
  amountUsdc: decimalToNumber(i.amountUsdc),
  chainId: i.chainId,
  txHash: i.txHash,
  status: i.status,
  error: i.error,
  createdAt: i.createdAt.toISOString(),
});

export const toRound = (r: DbRound): Round => ({
  id: r.id,
  startupId: r.startupId,
  onchainRoundId: r.onchainRoundId,
  escrowAddress: r.escrowAddress,
  targetUsdc: decimalToNumber(r.targetUsdc),
  raisedUsdc: decimalToNumber(r.raisedUsdc),
  minTicketUsdc: decimalToNumber(r.minTicketUsdc),
  deadline: r.deadline.toISOString(),
  status: r.status,
  milestones: r.milestones as Milestone[],
});

export const toRoundDetail = (
  r: DbRound & { startup: DbStartup; investments: DbInvestment[] },
): RoundDetail => ({
  ...toRound(r),
  startup: toStartup(r.startup),
  investments: r.investments.map(toInvestment),
});
