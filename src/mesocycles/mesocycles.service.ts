import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GoalModeService } from '../goal-mode/goal-mode.service';

@Injectable()
export class MesocyclesService {
  constructor(
    private prisma: PrismaService,
    private goalMode: GoalModeService,
  ) {}

  async generate(userId: string, name: string, totalWeeks: number, templateId?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const params = this.goalMode.getParameters(user.goalMode);

    const volumeTargets = {
      CHEST: { mev: 8, mrv: 16, current: 10 },
      BACK: { mev: 10, mrv: 18, current: 12 },
      QUADS: { mev: 8, mrv: 16, current: 10 },
      HAMSTRINGS: { mev: 6, mrv: 12, current: 8 },
      GLUTES: { mev: 4, mrv: 12, current: 6 },
      SIDE_DELT: { mev: 6, mrv: 16, current: 8 },
      FRONT_DELT: { mev: 4, mrv: 8, current: 4 },
      REAR_DELT: { mev: 6, mrv: 16, current: 8 },
      BICEPS: { mev: 6, mrv: 14, current: 8 },
      TRICEPS: { mev: 6, mrv: 14, current: 8 },
      CALVES: { mev: 6, mrv: 16, current: 8 },
      ABS: { mev: 0, mrv: 16, current: 6 },
    };

    return this.prisma.mesocycle.create({
      data: {
        userId,
        name,
        totalWeeks,
        volumeTargets,
        templateId: templateId ?? null,
        status: 'ACTIVE',
        currentWeek: 1,
      },
    });
  }

  async findActive(userId: string) {
    return this.prisma.mesocycle.findFirst({
      where: { userId, status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(userId: string, id: string) {
    const mesocycle = await this.prisma.mesocycle.findFirst({
      where: { id, userId },
    });
    if (!mesocycle) throw new NotFoundException('Mesocycle not found');
    return mesocycle;
  }

  async close(userId: string, id: string) {
    await this.findOne(userId, id);
    return this.prisma.mesocycle.update({
      where: { id },
      data: { status: 'COMPLETED' },
    });
  }

  async getVolumeStatus(userId: string, id: string) {
    const mesocycle = await this.findOne(userId, id);
    return {
      currentWeek: mesocycle.currentWeek,
      totalWeeks: mesocycle.totalWeeks,
      volumeTargets: mesocycle.volumeTargets,
    };
  }
}