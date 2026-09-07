import { type ArgumentsHost, Catch, type ExceptionFilter, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import { BaseError, ContractFunctionRevertedError } from 'viem';

// Turns viem contract reverts into readable 409s instead of opaque 500s:
// {"error":"ContractRevert","reason":"NotFinalizable","message":"..."}.
@Catch(BaseError)
export class ChainErrorFilter implements ExceptionFilter<BaseError> {
  catch(error: BaseError, host: ArgumentsHost): void {
    const res = host.switchToHttp().getResponse<Response>();
    const revert = error.walk((e) => e instanceof ContractFunctionRevertedError);
    const reason = revert instanceof ContractFunctionRevertedError ? (revert.data?.errorName ?? revert.reason ?? null) : null;
    res.status(HttpStatus.CONFLICT).json({
      statusCode: HttpStatus.CONFLICT,
      error: 'ContractRevert',
      reason,
      message: reason ? `On-chain call reverted: ${reason}` : error.shortMessage,
    });
  }
}
