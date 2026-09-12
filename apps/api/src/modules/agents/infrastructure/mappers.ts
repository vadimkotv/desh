import type { Decision, Mandate } from '@agentipo/shared';
import type {
  Agent as DbAgent,
  Decision as DbDecision,
  Investment as DbInvestment,
} from '../../../generated/prisma/client';
import { decimalToNumber } from '../../../common/money';
import { toInvestment } from '../../startups/infrastructure/mappers';
import type { AgentRecord } from '../domain/agent.repository';

export const toAgentRecord = (a: DbAgent): AgentRecord => ({
  id: a.id,
  name: a.name,
  ownerAddress: a.ownerAddress,
  walletKind: a.walletKind,
  walletAddress: a.walletAddress,
  hederaAccountId: a.hederaAccountId,
  erc8004AgentId: a.erc8004AgentId,
  erc8004ChainId: a.erc8004ChainId,
  status: a.status,
  mode: a.mode,
  mandate: a.mandate as Mandate,
  createdAt: a.createdAt.toISOString(),
  keyIndex: a.keyIndex,
  circleWalletId: a.circleWalletId,
});

export const toDecision = (d: DbDecision & { investment: DbInvestment | null }): Decision => ({
  id: d.id,
  agentId: d.agentId,
  roundId: d.roundId,
  reportId: d.reportId,
  action: d.action,
  amountUsdc: decimalToNumber(d.amountUsdc),
  confidence: d.confidence,
  reasoning: d.reasoning,
  keyRisks: d.keyRisks as string[],
  engine: d.engine,
  dataPaymentTxId: d.dataPaymentTxId,
  approval: d.approval,
  approvedBy: d.approvedBy,
  decidedAt: d.decidedAt?.toISOString() ?? null,
  investment: d.investment ? toInvestment(d.investment) : null,
  createdAt: d.createdAt.toISOString(),
});
