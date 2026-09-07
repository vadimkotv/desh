import { Injectable, Logger } from '@nestjs/common';
import { toBaseUnits } from '../../../../common/money';
import type { EscrowOperator } from '../../domain/escrow-operator.port';
import { ArcClients } from './arc-clients';
import { roundEscrowAbi } from './escrow.abi';
import { PlatformSigner } from './platform-signer';

@Injectable()
export class ArcEscrowOperator implements EscrowOperator {
  private readonly log = new Logger(ArcEscrowOperator.name);

  constructor(
    private readonly arc: ArcClients,
    private readonly signer: PlatformSigner,
  ) {}

  async finalize(onchainRoundId: number): Promise<string> {
    return this.call('finalize', [BigInt(onchainRoundId)]);
  }

  async releaseMilestone(onchainRoundId: number): Promise<string> {
    return this.call('releaseMilestone', [BigInt(onchainRoundId)]);
  }

  async distribute(onchainRoundId: number, amountUsdc: number): Promise<string> {
    const units = toBaseUnits(amountUsdc);
    await this.signer.ensureUsdcAllowance(units);
    return this.call('distribute', [BigInt(onchainRoundId), units]);
  }

  private async call(fn: 'finalize' | 'releaseMilestone' | 'distribute', args: readonly unknown[]): Promise<string> {
    const hash = await this.signer.write(this.arc.escrowAddress, roundEscrowAbi, fn, args);
    this.log.log(`${fn}(${args.join(', ')}) tx ${hash}`);
    return hash;
  }
}
