import { Injectable } from '@nestjs/common';
import type { PaymentReceipt as DbReceipt } from '../../../generated/prisma/client';
import { PrismaService } from '../../../common/prisma/prisma.service';
import type { NewPaymentReceipt, PaymentReceipt, PaymentReceiptRepository } from '../domain/payment-receipt.repository';

const toReceipt = (r: DbReceipt): PaymentReceipt => ({
  id: r.id,
  agentId: r.agentId,
  resource: r.resource,
  network: r.network,
  asset: r.asset,
  amount: r.amount,
  payer: r.payer,
  txId: r.txId,
  success: r.success,
  createdAt: r.createdAt.toISOString(),
});

@Injectable()
export class PrismaPaymentReceiptRepository implements PaymentReceiptRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(receipt: NewPaymentReceipt): Promise<PaymentReceipt> {
    return toReceipt(await this.prisma.paymentReceipt.create({ data: receipt }));
  }

  async list(limit = 100): Promise<PaymentReceipt[]> {
    const rows = await this.prisma.paymentReceipt.findMany({ orderBy: { createdAt: 'desc' }, take: limit });
    return rows.map(toReceipt);
  }

  async attachAgent(txId: string, agentId: string): Promise<void> {
    await this.prisma.paymentReceipt.updateMany({ where: { txId, agentId: null }, data: { agentId } });
  }
}
