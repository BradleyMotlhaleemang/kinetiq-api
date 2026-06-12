import Redis from 'ioredis';
import { ThrottlerStorage } from '@nestjs/throttler';

type ThrottlerStorageRecord = {
  totalHits: number;
  timeToExpire: number;
  isBlocked: boolean;
  timeToBlockExpire: number;
};

export class RedisThrottlerStorage implements ThrottlerStorage {
  constructor(private readonly redis: Redis) {}

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): Promise<ThrottlerStorageRecord> {
    const hitsKey = `throttle:${throttlerName}:${key}`;
    const blockKey = `throttle:block:${throttlerName}:${key}`;

    const blockTtl = await this.redis.pttl(blockKey);
    if (blockTtl > 0) {
      return {
        totalHits: limit + 1,
        timeToExpire: 0,
        isBlocked: true,
        timeToBlockExpire: Math.ceil(blockTtl / 1000),
      };
    }

    const totalHits = await this.redis.incr(hitsKey);
    let timeToExpireMs = await this.redis.pttl(hitsKey);
    if (timeToExpireMs < 0) {
      await this.redis.pexpire(hitsKey, ttl);
      timeToExpireMs = ttl;
    }

    if (totalHits > limit) {
      await this.redis.set(blockKey, '1', 'PX', blockDuration);
      return {
        totalHits,
        timeToExpire: Math.ceil(timeToExpireMs / 1000),
        isBlocked: true,
        timeToBlockExpire: Math.ceil(blockDuration / 1000),
      };
    }

    return {
      totalHits,
      timeToExpire: Math.ceil(timeToExpireMs / 1000),
      isBlocked: false,
      timeToBlockExpire: 0,
    };
  }
}
