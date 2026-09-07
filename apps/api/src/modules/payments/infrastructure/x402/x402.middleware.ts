import { Injectable, Logger, type NestMiddleware } from '@nestjs/common';
import { paymentMiddleware } from '@x402/express';
import type { NextFunction, Request, Response } from 'express';
import { AppConfig } from '../../../../config/app-config';
import { premiumRoutes } from './premium-routes';
import { X402ServerFactory } from './x402-server.factory';

type ExpressMiddleware = (req: Request, res: Response, next: NextFunction) => Promise<void>;

// Nest adapter around @x402/express. When x402 is not configured (no payTo account)
// the premium route is served for free and a warning is logged once.
@Injectable()
export class X402Middleware implements NestMiddleware {
  private readonly log = new Logger(X402Middleware.name);
  private readonly handler: ExpressMiddleware | null;

  constructor(config: AppConfig, factory: X402ServerFactory) {
    if (!config.features.x402) {
      this.log.warn('HEDERA_PAYTO_ACCOUNT_ID not set: premium routes are served without payment');
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
