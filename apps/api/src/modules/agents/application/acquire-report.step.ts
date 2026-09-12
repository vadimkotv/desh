import { Inject, Injectable, Logger } from '@nestjs/common';
import type { DueDiligenceReport } from '@agentipo/shared';
import { AUDIT_LOG, type AuditLog } from '../../audit/domain/audit.port';
import { DataAccessUseCase } from '../../data-room/application/data-access.usecase';
import { DiscloseMetricsQuery, type Disclosure } from '../../data-room/application/disclose-metrics.query';
import { PAID_DATA_CLIENT, type HederaPayer, type PaidDataClient } from '../../payments/domain/paid-data.port';
import { PremiumReportClient } from '../../payments/infrastructure/x402/premium-report.client';
import { AgentKeyDerivation } from '../../settlement/infrastructure/keys/agent-key.derivation';
import type { AgentRecord } from '../domain/agent.repository';
import { NOOP_REPORTER, type RunReporter } from '../domain/run-reporter';

export interface AcquiredReport {
  report: DueDiligenceReport;
  paymentTxId: string | null;
  disclosure: Disclosure;
}

// Step 1 of the pipeline: the agent gathers everything it is allowed to see. The
// platform's research is free; what costs the agent something is the founder's own
// numbers, which it has to ASK for — and the founder sees whose agent is asking.
@Injectable()
export class AcquireReportStep {
  private readonly log = new Logger(AcquireReportStep.name);

  constructor(
    @Inject(PAID_DATA_CLIENT) private readonly paidData: PaidDataClient,
    @Inject(AUDIT_LOG) private readonly audit: AuditLog,
    private readonly receipts: PremiumReportClient,
    private readonly keys: AgentKeyDerivation,
    private readonly disclose: DiscloseMetricsQuery,
    private readonly access: DataAccessUseCase,
  ) {}

  async run(agent: AgentRecord, round: { id: string; startupId: string }, reporter: RunReporter = NOOP_REPORTER): Promise<AcquiredReport> {
    const roundId = round.id;
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
    const disclosure = await this.gatedData(agent, round.startupId, reporter);
    return { report: data, paymentTxId, disclosure };
  }

  // The founder keeps some numbers closed. The agent can see that they exist, so it
  // asks once; the answer arrives on a later cycle and widens what it can reason over.
  private async gatedData(agent: AgentRecord, startupId: string, reporter: RunReporter): Promise<Disclosure> {
    const disclosure = await this.disclose.execute(startupId, agent.id);
    if (disclosure.withheldCount === 0 || disclosure.access !== 'NONE') return disclosure;

    const reason = `${agent.name} is evaluating this round under mandate: ${agent.mandate.thesis.slice(0, 160)}`;
    const request = await this.access.request(startupId, agent.id, reason);
    reporter.emit('access.requested', { requestId: request.id, startupId, withheld: disclosure.withheldCount });
    this.log.log(`agent ${agent.name} asked for ${disclosure.withheldCount} gated metric(s)`);
    return { ...disclosure, access: request.status };
  }

  private payerFor(agent: AgentRecord): HederaPayer | null {
    if (!agent.hederaAccountId || !this.keys.enabled) return null;
    return { accountId: agent.hederaAccountId, privateKeyHex: this.keys.privateKeyHex(agent.keyIndex) };
  }
}
