import { ServiceUnavailableException } from '@nestjs/common';
import { HealthService } from './health.service';

describe('HealthService', () => {
  const prisma = {
    $queryRaw: jest.fn(),
  };
  const redis = {
    ping: jest.fn(),
  };

  it('returns ok when database and redis are healthy', async () => {
    prisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);
    redis.ping.mockResolvedValue('PONG');

    const service = new HealthService(prisma as never, redis as never);
    const result = await service.check();

    expect(result.status).toBe('ok');
    expect(result.database).toBe('up');
    expect(result.redis).toBe('up');
  });

  it('throws when database is down', async () => {
    prisma.$queryRaw.mockRejectedValue(new Error('db down'));
    redis.ping.mockResolvedValue('PONG');

    const service = new HealthService(prisma as never, redis as never);
    await expect(service.check()).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
