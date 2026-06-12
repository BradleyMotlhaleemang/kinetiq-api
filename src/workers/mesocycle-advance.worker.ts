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

    if (activeMesocycles.length === 0) return;

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const sessionCounts = await this.prisma.workout.groupBy({
      by: ['mesocycleId'],
      where: {
        mesocycleId: { in: activeMesocycles.map((m) => m.id) },
        status: 'COMPLETED',
        completedAt: { gte: sevenDaysAgo },
      },
      _count: { id: true },
    });
    const sessionsByMesocycle = new Map(
      sessionCounts.map((row) => [row.mesocycleId, row._count.id]),
    );

    for (const mesocycle of activeMesocycles) {
      const sessionsThisWeek = sessionsByMesocycle.get(mesocycle.id) ?? 0;

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
