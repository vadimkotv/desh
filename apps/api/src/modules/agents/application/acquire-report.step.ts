import { Inject, Injectable, Logger } from '@nestjs/common';
import type { DueDiligenceReport } from '@agentipo/shared';
import { AUDIT_LOG, type AuditLog } from '../../audit/domain/audit.port';
import { PAID_DATA_CLIENT, type HederaPayer, type PaidDataClient } from '../../payments/domain/paid-data.port';
import { PremiumReportClient } from '../../payments/infrastructure/x402/premium-report.client';
import { AgentKeyDerivation } from '../../settlement/infrastructure/keys/agent-key.derivation';
import type { AgentRecord } from '../domain/agent.repository';
import { NOOP_REPORTER, type RunReporter } from '../domain/run-reporter';

export interface AcquiredReport {
  report: DueDiligenceReport;
  paymentTxId: string | null;
}

// Step 1 of the pipeline: the agent BUYS the premium report over x402 with its own
// Hedera account. This is the "agent consuming a paid service" leg of the marketplace.
@Injectable()
export class AcquireReportStep {
  private readonly log = new Logger(AcquireReportStep.name);

  constructor(
    @Inject(PAID_DATA_CLIENT) private readonly paidData: PaidDataClient,
    @Inject(AUDIT_LOG) private readonly audit: AuditLog,
    private readonly receipts: PremiumReportClient,
    private readonly keys: AgentKeyDerivation,
  ) {}

  async run(agent: AgentRecord, roundId: string, reporter: RunReporter = NOOP_REPORTER): Promise<AcquiredReport> {
    const payer = this.payerFor(agent);
    reporter.emit('data.purchasing', { payer: payer?.accountId ?? null, resource: `due-diligence/rounds/${roundId}/premium` });
    const { data, payment } = await this.paidData.fetchPremiumReport(roundId, payer);
    const paymentTxId = payment?.txId ?? null;
    reporter.emit('data.purchased', { reportId: data.id, score: data.score, dataCoverage: data.dataCoverage, txId: paymentTxId, ...(payment ?? {}) });
    if (paymentTxId) {
      await this.receipts.attachAgent(paymentTxId, agent.id);
      await this.audit.record('DATA_PURCHASED', { roundId, reportId: data.id, ...payment }, agent.id);
      this.log.log(`agent ${agent.name} paid for report ${data.id} on ${payment?.network}: ${paymentTxId}`);
    }
    return { report: data, paymentTxId };
  }

  private payerFor(agent: AgentRecord): HederaPayer | null {
    if (!agent.hederaAccountId || !this.keys.enabled) return null;
    return { accountId: agent.hederaAccountId, privateKeyHex: this.keys.privateKeyHex(agent.keyIndex) };
  }
}
