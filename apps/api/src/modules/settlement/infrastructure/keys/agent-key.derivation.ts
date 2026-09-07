import { Injectable } from '@nestjs/common';
import { type HDAccount, mnemonicToAccount } from 'viem/accounts';
import { AppConfig } from '../../../../config/app-config';

// Agent keys are never stored: each agent owns HD index `keyIndex` under the platform
// mnemonic (m/44'/60'/0'/0/{keyIndex}). The same secp256k1 key doubles as the agent's
// Hedera ECDSA key, so one derivation serves both Arc (EVM) and Hedera (x402 payer).
@Injectable()
export class AgentKeyDerivation {
  constructor(private readonly config: AppConfig) {}

  get enabled(): boolean {
    return this.config.features.agentKeys;
  }

  account(keyIndex: number): HDAccount {
    const mnemonic = this.config.env.AGENT_MASTER_MNEMONIC;
    if (!mnemonic) throw new Error('AGENT_MASTER_MNEMONIC is not configured');
    return mnemonicToAccount(mnemonic, { addressIndex: keyIndex });
  }

  privateKeyHex(keyIndex: number): `0x${string}` {
    const hd = this.account(keyIndex).getHdKey();
    if (!hd.privateKey) throw new Error('HD key has no private key');
    return `0x${Buffer.from(hd.privateKey).toString('hex')}`;
  }
}
