import 'dotenv/config';
import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ChainErrorFilter } from './common/http/chain-error.filter';
import { AppConfig } from './config/app-config';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const config = app.get(AppConfig);

  app.enableCors({ origin: config.env.CORS_ORIGIN.split(','), credentials: false });
  app.enableShutdownHooks();
  app.useGlobalFilters(new ChainErrorFilter());

  const doc = new DocumentBuilder()
    .setTitle('AgentIPO API')
    .setDescription('Open-data fundraising infrastructure where AI agents make the investment decisions.')
    .setVersion('0.1.0')
    .build();
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, doc));

  await app.listen(config.env.PORT);
  const log = new Logger('Bootstrap');
  log.log(`API listening on ${config.env.API_PUBLIC_URL} (docs at /docs)`);
  log.log(`Features: ${JSON.stringify(config.features)}`);
}

void bootstrap();
