import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GoalModeService } from '../goal-mode/goal-mode.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class MesocyclesService {
  constructor(
    private prisma: PrismaService,
    private goalMode: GoalModeService,
    private users: UsersService,
  ) {}

  async generate(userId: string, name: string, totalWeeks: number, templateId?: string) {
    const user = await this.users.findById(userId);
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

  async recommendTemplate(userId: string) {
    const user = await this.users.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const templates = await this.prisma.workoutTemplate.findMany({
      orderBy: [{ daysPerWeek: 'asc' }, { name: 'asc' }],
      include: {
        splits: {
          include: {
            days: {
              orderBy: { dayNumber: 'asc' },
              include: {
                exercises: {
                  orderBy: { orderIndex: 'asc' },
                },
              },
            },
          },
        },
      },
    });

    const recommendedName = this.selectTemplateName(
      user.goalMode,
      user.experienceLevel,
    );

    const recommended = templates.find((template) => template.name === recommendedName);
    if (!recommended) {
      throw new NotFoundException('Recommended template not found');
    }

    const alternatives = templates.filter((template) => template.id !== recommended.id);

    return {
      recommended,
      alternatives,
      rationale: this.buildRecommendationRationale(
        user.goalMode,
        user.experienceLevel,
        recommended.name,
      ),
      profile: {
        goalMode: user.goalMode,
        experienceLevel: user.experienceLevel,
      },
    };
  }

  private selectTemplateName(
    goalMode: string | null | undefined,
    experienceLevel: string | null | undefined,
  ) {
    if (experienceLevel === 'BEGINNER') {
      return 'Full Body';
    }

    if (goalMode === 'STRENGTH') {
      return 'Upper Lower';
    }

    if (goalMode === 'WEIGHT_LOSS' || goalMode === 'MAINTAIN') {
      return experienceLevel === 'ADVANCED' ? 'Upper Lower' : 'Full Body';
    }

    if (goalMode === 'MUSCLE_GAIN') {
      return experienceLevel === 'ADVANCED' ? 'Push Pull Legs' : 'Upper Lower';
    }

    return experienceLevel === 'ADVANCED' ? 'Upper Lower' : 'Full Body';
  }

  private buildRecommendationRationale(
    goalMode: string | null | undefined,
    experienceLevel: string | null | undefined,
    templateName: string,
  ) {
    if (experienceLevel === 'BEGINNER') {
      return `${templateName} is recommended because higher-frequency full-body sessions are easier to recover from and reinforce exercise skill for beginners.`;
    }

    if (goalMode === 'STRENGTH') {
      return `${templateName} is recommended because it balances lift frequency, recovery, and weekly exposure well for strength-focused blocks.`;
    }

    if (goalMode === 'MUSCLE_GAIN' && experienceLevel === 'ADVANCED') {
      return `${templateName} is recommended because advanced hypertrophy blocks usually benefit from higher weekly specialization and training frequency.`;
    }

    if (goalMode === 'WEIGHT_LOSS' || goalMode === 'MAINTAIN') {
      return `${templateName} is recommended because it keeps weekly volume manageable while preserving recovery during lower-calorie or maintenance phases.`;
    }

    return `${templateName} is recommended because it provides a strong hypertrophy balance between training frequency, recovery, and session quality.`;
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
