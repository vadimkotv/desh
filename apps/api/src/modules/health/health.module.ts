import { Controller, Get, Module } from '@nestjs/common';
import { AppConfig } from '../../config/app-config';

@Controller('health')
class HealthController {
  constructor(private readonly config: AppConfig) {}

  @Get()
  health() {
    return { ok: true, features: this.config.features, time: new Date().toISOString() };
  }
}

@Module({ controllers: [HealthController] })
export class HealthModule {}
