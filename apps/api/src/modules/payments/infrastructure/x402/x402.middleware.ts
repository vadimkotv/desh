import { Injectable, Logger, type NestMiddleware } from '@nestjs/common';
import { paymentMiddleware } from '@x402/express';
import type { NextFunction, Request, Response } from 'express';
import { AppConfig } from '../../../../config/app-config';
import { premiumRoutes } from './premium-routes';
import { X402ServerFactory } from './x402-server.factory';

type ExpressMiddleware = (req: Request, res: Response, next: NextFunction) => Promise<void>;

// Nest adapter around @x402/express. The report itself is free by default — founders
// gate their own numbers instead of the platform charging for its research — so this
// only arms when X402_GATE_REPORTS is on and a payTo account is configured.
@Injectable()
export class X402Middleware implements NestMiddleware {
  private readonly log = new Logger(X402Middleware.name);
  private readonly handler: ExpressMiddleware | null;

  constructor(config: AppConfig, factory: X402ServerFactory) {
    if (!config.features.x402) {
      this.log.log('report paywall off: research is free, founders gate their own data');
      this.handler = null;
      return;
    }
    this.handler = paymentMiddleware(premiumRoutes(config), factory.get()) as ExpressMiddleware;
    this.log.log(`x402 paywall active on ${config.hederaNetwork} via ${config.env.X402_FACILITATOR_URL}`);
  }

  use(req: Request, res: Response, next: NextFunction): void {
    if (!this.handler) return next();
    void this.handler(req, res, next).catch(next);
  }
}
