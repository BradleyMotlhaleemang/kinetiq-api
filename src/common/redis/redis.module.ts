import { Global, Module } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from './redis.constants';
import { RedisCacheService } from './redis-cache.service';

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: (): Redis | null => {
        const host = process.env.REDIS_HOST;
        if (!host) return null;
        return new Redis({
          host,
          port: process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : 6379,
          maxRetriesPerRequest: null,
          enableReadyCheck: false,
        });
      },
    },
    RedisCacheService,
  ],
  exports: [REDIS_CLIENT, RedisCacheService],
})
export class RedisModule {}
