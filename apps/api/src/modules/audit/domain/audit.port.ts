import type { AuditEntry, AuditKind } from '@agentipo/shared';

export const AUDIT_LOG = Symbol('AUDIT_LOG');
export const CONSENSUS_PUBLISHER = Symbol('CONSENSUS_PUBLISHER');
export const AUDIT_REPOSITORY = Symbol('AUDIT_REPOSITORY');

export interface AuditLog {
  record(kind: AuditKind, payload: Record<string, unknown>, agentId?: string | null): Promise<AuditEntry>;
}

export interface ConsensusReceipt {
  topicId: string;
  sequenceNumber: number;
}

// Append-only public log (Hedera Consensus Service). Null when Hedera is not configured.
export interface ConsensusPublisher {
  publish(message: string): Promise<ConsensusReceipt>;
}

export interface AuditRepository {
  create(kind: AuditKind, payload: Record<string, unknown>, agentId?: string | null): Promise<AuditEntry>;
  attachConsensus(id: string, receipt: ConsensusReceipt): Promise<void>;
  list(limit?: number, agentId?: string): Promise<AuditEntry[]>;
}
