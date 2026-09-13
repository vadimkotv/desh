import { type ArgumentsHost, Catch, type ExceptionFilter, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import { BaseError, ContractFunctionRevertedError, HttpRequestError, TimeoutError } from 'viem';

// Chain failures come in two kinds and they need different answers.
//
// A revert is the contract saying no, and the caller can act on the reason:
// {"error":"ContractRevert","reason":"NotFinalizable"} as a 409.
//
// An unreachable RPC is not a revert at all. Reporting it as one sends whoever is
// debugging — on a demo, at the worst moment — looking for a contract bug that does not
// exist, so it surfaces as a 503 that names the real problem.
@Catch(BaseError)
export class ChainErrorFilter implements ExceptionFilter<BaseError> {
  catch(error: BaseError, host: ArgumentsHost): void {
    const res = host.switchToHttp().getResponse<Response>();
    const revert = error.walk((e) => e instanceof ContractFunctionRevertedError);

    if (!(revert instanceof ContractFunctionRevertedError) && this.isTransport(error)) {
      res.status(HttpStatus.SERVICE_UNAVAILABLE).json({
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
        error: 'ChainUnreachable',
        reason: null,
        message: `chain RPC is not responding: ${error.shortMessage}`,
      });
      return;
    }

    const reason =
      revert instanceof ContractFunctionRevertedError
        ? (revert.data?.errorName ?? revert.reason ?? null)
        : null;
    res.status(HttpStatus.CONFLICT).json({
      statusCode: HttpStatus.CONFLICT,
      error: 'ContractRevert',
      reason,
      message: reason ? `On-chain call reverted: ${reason}` : error.shortMessage,
    });
  }

  private isTransport(error: BaseError): boolean {
    return Boolean(error.walk((e) => e instanceof HttpRequestError || e instanceof TimeoutError));
  }
}
