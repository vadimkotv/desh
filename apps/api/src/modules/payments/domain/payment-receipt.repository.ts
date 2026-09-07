export const PAYMENT_RECEIPT_REPOSITORY = Symbol('PAYMENT_RECEIPT_REPOSITORY');

export interface NewPaymentReceipt {
  agentId?: string | null;
  resource: string;
  network: string;
  asset: string;
  amount: string;
  payer: string;
  txId?: string | null;
  success: boolean;
}

export interface PaymentReceipt extends NewPaymentReceipt {
  id: string;
  createdAt: string;
}

export interface PaymentReceiptRepository {
  save(receipt: NewPaymentReceipt): Promise<PaymentReceipt>;
  list(limit?: number): Promise<PaymentReceipt[]>;
  attachAgent(txId: string, agentId: string): Promise<void>;
}
