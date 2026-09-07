import { Injectable, Logger } from '@nestjs/common';
import { HEDERA_TESTNET } from '@agentipo/shared';
import { AccountCreateTransaction, AccountId, Hbar, PrivateKey, TokenId, TransferTransaction } from '@hiero-ledger/sdk';
import { AppConfig } from '../../../../config/app-config';
import { HederaClientProvider } from '../../../../common/hedera/hedera-client.provider';

// Gives every agent its own Hedera account (same secp256k1 key as its EVM wallet),
// pre-funded with a little HBAR for fees and USDC for x402 data purchases.
@Injectable()
export class HederaAccountFactory {
  private readonly log = new Logger(HederaAccountFactory.name);

  constructor(
    private readonly hedera: HederaClientProvider,
    private readonly config: AppConfig,
  ) {}

  get enabled(): boolean {
    return this.hedera.enabled;
  }

  async create(privateKeyHex: `0x${string}`): Promise<string> {
    const client = this.hedera.get();
    const key = PrivateKey.fromStringECDSA(privateKeyHex);
    const tx = await new AccountCreateTransaction()
      .setKeyWithoutAlias(key.publicKey)
      .setInitialBalance(new Hbar(this.config.env.AGENT_HEDERA_INITIAL_HBAR))
      .setMaxAutomaticTokenAssociations(-1)
      .execute(client);
    const receipt = await tx.getReceipt(client);
    if (!receipt.accountId) throw new Error('AccountCreate returned no accountId');
    const accountId = receipt.accountId.toString();
    this.log.log(`Hedera account ${accountId} created`);

    const usdc = this.config.env.AGENT_HEDERA_INITIAL_USDC;
    if (usdc > 0) await this.fundUsdc(accountId, usdc);
    return accountId;
  }

  private async fundUsdc(accountId: string, amountUsdc: number): Promise<void> {
    const client = this.hedera.get();
    const token = TokenId.fromString(HEDERA_TESTNET.usdc);
    const units = Math.round(amountUsdc * 10 ** HEDERA_TESTNET.usdcDecimals);
    try {
      const tx = await new TransferTransaction()
        .addTokenTransfer(token, AccountId.fromString(this.hedera.operatorId), -units)
        .addTokenTransfer(token, AccountId.fromString(accountId), units)
        .execute(client);
      await tx.getReceipt(client);
      this.log.log(`funded ${accountId} with ${amountUsdc} USDC`);
    } catch (err) {
      this.log.warn(`USDC funding skipped for ${accountId}: ${(err as Error).message}`);
    }
  }
}
