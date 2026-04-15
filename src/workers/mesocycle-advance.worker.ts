import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MesocycleAdvanceWorker {
  constructor(private prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async advanceWeeks() {
    const activeMesocycles = await this.prisma.mesocycle.findMany({
      where: { status: 'ACTIVE' },
    });

    for (const mesocycle of activeMesocycles) {
      const sessionsThisWeek = await this.prisma.workout.count({
        where: {
          mesocycleId: mesocycle.id,
          status: 'COMPLETED',
          completedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      });

      if (sessionsThisWeek >= 2) {
        const nextWeek = mesocycle.currentWeek + 1;

        if (nextWeek > mesocycle.totalWeeks) {
          await this.prisma.mesocycle.update({
            where: { id: mesocycle.id },
            data: { status: 'COMPLETED' },
          });
        } else {
          await this.prisma.mesocycle.update({
            where: { id: mesocycle.id },
            data: { currentWeek: nextWeek },
          });
        }
      }
    }
  }
}