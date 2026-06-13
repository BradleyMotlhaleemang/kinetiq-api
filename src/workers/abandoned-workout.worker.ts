import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AbandonedWorkoutWorker {
  private readonly logger = new Logger(AbandonedWorkoutWorker.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async markStaleWorkoutsAbandoned() {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const result = await this.prisma.workout.updateMany({
      where: {
        status: 'IN_PROGRESS',
        startedAt: { lt: cutoff },
      },
      data: {
        status: 'ABANDONED',
      },
    });

    if (result.count > 0) {
      this.logger.log(`Marked ${result.count} stale workout(s) as ABANDONED`);
    }
  }
}
