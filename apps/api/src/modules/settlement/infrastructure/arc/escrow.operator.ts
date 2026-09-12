import { Injectable, Logger } from '@nestjs/common';
import { toBaseUnits } from '../../../../common/money';
import type { EscrowOperator, ExitSettlement } from '../../domain/escrow-operator.port';
import { ArcClients } from './arc-clients';
import { EXIT_KIND_INDEX, roundEscrowAbi } from './escrow.abi';
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

  async settleExit(onchainRoundId: number, exit: ExitSettlement): Promise<string> {
    const units = toBaseUnits(exit.proceedsUsdc);
    await this.signer.ensureUsdcAllowance(units);
    return this.call('settleExit', [
      BigInt(onchainRoundId),
      EXIT_KIND_INDEX[exit.kind],
      toBaseUnits(exit.valuationUsdc),
      units,
      exit.evidenceUri,
    ]);
  }

  private async call(fn: 'finalize' | 'releaseMilestone' | 'settleExit', args: readonly unknown[]): Promise<string> {
    const hash = await this.signer.write(this.arc.escrowAddress, roundEscrowAbi, fn, args);
    this.log.log(`${fn}(${args.join(', ')}) tx ${hash}`);
    return hash;
  }
}
