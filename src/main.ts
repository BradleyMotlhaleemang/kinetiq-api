import * as dotenv from 'dotenv';
dotenv.config();

import './instrument';

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import * as Sentry from '@sentry/nestjs';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.set('trust proxy', 1);

  app.use(cookieParser());

  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));

  app.useGlobalFilters(new AllExceptionsFilter(), new PrismaExceptionFilter());

  const isDev = process.env.NODE_ENV !== 'production';

  function getProductionOrigins(): string[] {
    const origins = new Set<string>();
    const frontend = process.env.FRONTEND_URL?.trim();
    if (frontend) origins.add(frontend);
    for (const entry of process.env.CORS_ORIGINS?.split(',') ?? []) {
      const trimmed = entry.trim();
      if (trimmed) origins.add(trimmed);
    }
    return [...origins];
  }

  app.enableCors({
    origin: isDev
      ? (origin, callback) => {
          if (!origin) {
            callback(null, true);
            return;
          }
          const allowed =
            origin.startsWith('http://localhost:') ||
            origin.startsWith('http://127.0.0.1:') ||
            /^http:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d+$/.test(origin) ||
            /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}:\d+$/.test(origin);
          callback(null, allowed);
        }
      : (origin, callback) => {
          if (!origin) {
            callback(null, true);
            return;
          }
          const allowed = getProductionOrigins();
          if (allowed.length === 0) {
            callback(
              new Error(
                'CORS misconfigured: set FRONTEND_URL (e.g. https://app.yourdomain.com)',
              ),
              false,
            );
            return;
          }
          callback(null, allowed.includes(origin));
        },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key'],
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Kinetiq API running on port ${port}`);
}

bootstrap().catch(async (err) => {
  Sentry.captureException(err);
  await Sentry.flush(2000);
  console.error('Fatal bootstrap error:', err);
  process.exit(1);
});