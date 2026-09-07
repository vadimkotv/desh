import { Controller, Get, Inject, Param, ParseIntPipe, ServiceUnavailableException } from '@nestjs/common';
import { evmAddress } from '@agentipo/shared';
import { ZodValidationPipe } from '../../../common/http/zod-validation.pipe';
import { ApiTags } from '@nestjs/swagger';
import { WalletBalanceQuery } from '../application/wallet-balance.query';
import { ESCROW_READER, type EscrowReader } from '../domain/escrow-reader.port';
import { SettlementRailResolver } from '../application/settlement-rail.resolver';

@ApiTags('settlement')
@Controller('settlement')
export class SettlementController {
  constructor(
    @Inject(ESCROW_READER) private readonly escrow: EscrowReader | null,
    private readonly balances: WalletBalanceQuery,
    private readonly rails: SettlementRailResolver,
  ) {}

  @Get('rails')
  rails_() {
    return { rails: this.rails.available };
  }

  @Get('rounds/:onchainId')
  round(@Param('onchainId', ParseIntPipe) onchainId: number) {
    if (!this.escrow) throw new ServiceUnavailableException('Arc escrow is not configured');
    return this.escrow.getRound(onchainId);
  }

  @Get('wallets/:address/usdc')
  async balance(@Param('address', new ZodValidationPipe(evmAddress)) address: string) {
    return { address, usdc: await this.balances.usdcBalance(address) };
  }
}
