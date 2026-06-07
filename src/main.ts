import * as dotenv from 'dotenv';
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());

  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));

  const isDev = process.env.NODE_ENV !== 'production';
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
      : ['http://localhost:3001', 'http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Kinetiq API running on port ${port}`);
}
bootstrap();