import { Inject, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { REDIS_CLIENT } from '../common/redis/redis.constants';
import type Redis from 'ioredis';

export type HealthStatus = {
  status: 'ok' | 'degraded';
  database: 'up' | 'down';
  redis: 'up' | 'down' | 'disabled';
  timestamp: string;
};

@Injectable()
export class HealthService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis | null,
  ) {}

  async check(): Promise<HealthStatus> {
    let database: 'up' | 'down' = 'down';
    let redis: 'up' | 'down' | 'disabled' = this.redis ? 'down' : 'disabled';

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      database = 'up';
    } catch {
      database = 'down';
    }

    if (this.redis) {
      try {
        const pong = await this.redis.ping();
        redis = pong === 'PONG' ? 'up' : 'down';
      } catch {
        redis = 'down';
      }
    }

    const status: HealthStatus = {
      status: database === 'up' && (redis === 'up' || redis === 'disabled') ? 'ok' : 'degraded',
      database,
      redis,
      timestamp: new Date().toISOString(),
    };

    if (database === 'down' || redis === 'down') {
      throw new ServiceUnavailableException(status);
    }

    return status;
  }
}
