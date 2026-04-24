import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { GoalModeService } from '../goal-mode/goal-mode.service';
import { UsersService } from '../users/users.service';
import { transformWorkoutTemplate } from '../common/transforms';
import { EXPERIENCE_LEVEL_LABELS, GOAL_MODE_LABELS } from '../common/transforms';
import { TemplatesService } from '../templates/templates.service';

export class GenerateMesocycleDto {
  templateId!: string;
  name?: string;
  overrideDurationWeeks?: number;
  musclePriorities?: Record<string, 'EMPHASIZE' | 'GROW' | 'MAINTAIN'>;
}

const MUSCLE_VOLUME_DEFAULTS: Record<string, { mev: number; mrv: number }> = {
  CHEST: { mev: 10, mrv: 22 },
  BACK: { mev: 10, mrv: 25 },
  SHOULDERS: { mev: 8, mrv: 20 },
  TRICEPS: { mev: 6, mrv: 18 },
  BICEPS: { mev: 6, mrv: 20 },
  QUADS: { mev: 8, mrv: 20 },
  HAMSTRINGS: { mev: 6, mrv: 16 },
  GLUTES: { mev: 4, mrv: 16 },
  CALVES: { mev: 8, mrv: 20 },
  ABS: { mev: 4, mrv: 16 },
};

function applyMusclePriority(
  mev: number,
  mrv: number,
  priority: 'EMPHASIZE' | 'GROW' | 'MAINTAIN',
): number {
  const range = mrv - mev;
  switch (priority) {
    case 'EMPHASIZE': return Math.round(mev + range * 0.70);
    case 'GROW': return Math.round(mev + range * 0.40);
    case 'MAINTAIN': return mev;
    default: return Math.round(mev + range * 0.40);
  }
}

function toVolumeKey(value: string) {
  const normalized = value.toUpperCase();
  if (normalized.includes('DELT') || normalized.includes('SHOULDER')) return 'SHOULDERS';
  if (normalized.includes('HAMSTRING')) return 'HAMSTRINGS';
  if (normalized.includes('GLUTE')) return 'GLUTES';
  if (normalized.includes('QUAD')) return 'QUADS';
  if (normalized.includes('TRICEP')) return 'TRICEPS';
  if (normalized.includes('BICEP')) return 'BICEPS';
  if (normalized.includes('CALF')) return 'CALVES';
  if (normalized.includes('AB')) return 'ABS';
  if (normalized.includes('CHEST')) return 'CHEST';
  if (normalized.includes('BACK') || normalized.includes('LATS')) return 'BACK';
  return normalized;
}

function buildVolumeTargets(
  primaryMuscles: string[],
  musclePriorities?: Record<string, 'EMPHASIZE' | 'GROW' | 'MAINTAIN'>,
): Record<string, { mev: number; mrv: number; current: number }> {
  const normalizedPrimary = primaryMuscles.map(toVolumeKey);
  const result: Record<string, { mev: number; mrv: number; current: number }> = {};

  for (const [muscle, defaults] of Object.entries(MUSCLE_VOLUME_DEFAULTS)) {
    const priority = musclePriorities?.[muscle] ?? musclePriorities?.[muscle.toLowerCase()] ?? 'GROW';
    const isPrimary = normalizedPrimary.some((p) => p.includes(muscle));
    const effectivePriority: 'EMPHASIZE' | 'GROW' | 'MAINTAIN' =
      isPrimary && priority === 'GROW' ? 'GROW' : priority;

    result[muscle] = {
      mev: defaults.mev,
      mrv: defaults.mrv,
      current: applyMusclePriority(defaults.mev, defaults.mrv, effectivePriority),
    };
  }
  return result;
}

@Injectable()
export class MesocyclesService {
  constructor(
    private prisma: PrismaService,
    private goalMode: GoalModeService,
    private users: UsersService,
    private templates: TemplatesService,
  ) {}

  async generate(userId: string, name: string, totalWeeks: number, templateId?: string): Promise<any>;
  async generate(userId: string, dto: GenerateMesocycleDto): Promise<any>;
  async generate(
    userId: string,
    nameOrDto: string | GenerateMesocycleDto,
    totalWeeks?: number,
    templateId?: string,
  ) {
    if (typeof nameOrDto === 'object' && nameOrDto?.templateId) {
      return this.generateFromTemplate(userId, nameOrDto);
    }

    const name = nameOrDto as string;
    const user = await this.users.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    this.goalMode.getParameters(user.goalMode);

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
        totalWeeks: totalWeeks ?? 8,
        volumeTargets,
        templateId: templateId ?? null,
        status: 'ACTIVE',
        currentWeek: 1,
      },
    });
  }

  private async generateFromTemplate(userId: string, dto: GenerateMesocycleDto) {
    const tmpl = await this.templates.expand(dto.templateId);

    const durationWeeks = dto.overrideDurationWeeks ?? 8;

    if (Number.isNaN(durationWeeks) || durationWeeks < 1 || durationWeeks > 16) {
      throw new BadRequestException('durationWeeks must be between 1 and 16');
    }

    const primaryMuscles = tmpl.trainingDays
      .filter((day) => !day.isRestDay && day.workoutTemplate)
      .map((day) => day.workoutTemplate!.primaryMuscle);
    const volumeTargets = buildVolumeTargets(primaryMuscles, dto.musclePriorities);

    const mesocycle = await this.prisma.mesocycle.create({
      data: {
        userId,
        name: dto.name ?? tmpl.name,
        startDate: new Date(),
        totalWeeks: durationWeeks,
        currentWeek: 1,
        status: 'ACTIVE',
        volumeTargets,
        templateId: tmpl.id,
      },
    });

    const trainingDays = tmpl.trainingDays.filter((day) => !day.isRestDay);
    const workoutInserts: {
      userId: string;
      mesocycleId: string;
      splitDayLabel: string;
      sessionType: string;
      weekNumber: number;
      dayNumber: number;
      scheduledDate: Date;
      date: Date;
      status: 'PLANNED';
      prescriptionSnapshot: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput;
    }[] = [];

    for (let week = 1; week <= durationWeeks; week++) {
      for (const day of trainingDays) {
        const prescriptionSnapshot = day.workoutTemplate ? ({
          templateSlug: day.workoutTemplate.slug,
          templateName: day.workoutTemplate.name,
          primaryMuscle: day.workoutTemplate.primaryMuscle,
          slots: day.workoutTemplate.slots.map((s) => ({
            order: s.order,
            slotLabel: s.slotLabel,
            sets: s.sets,
            reps: s.reps,
            rpe: s.rpe,
          })),
        } as Prisma.InputJsonValue) : null;

        const scheduledDate = new Date(
          mesocycle.startDate.getTime() +
            ((week - 1) * 7 + (day.dayNumber - 1)) * 24 * 60 * 60 * 1000,
        );

        workoutInserts.push({
          userId,
          mesocycleId: mesocycle.id,
          splitDayLabel: `W${week} D${day.dayNumber} - ${day.label}`,
          sessionType: day.label,
          weekNumber: week,
          dayNumber: day.dayNumber,
          scheduledDate,
          date: scheduledDate,
          status: 'PLANNED',
          prescriptionSnapshot: prescriptionSnapshot ?? Prisma.JsonNull,
        });
      }
    }

    if (workoutInserts.length > 0) {
      await this.prisma.workout.createMany({ data: workoutInserts });
    }

    return this.prisma.mesocycle.findUnique({
      where: { id: mesocycle.id },
      include: {
        workouts: {
          orderBy: [{ weekNumber: 'asc' }, { dayNumber: 'asc' }],
        },
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

    const recommended = templates.find((template) => template.name === recommendedName)
      ?? templates[0]
      ?? null;

    const alternatives = recommended
      ? templates.filter((template) => template.id !== recommended.id)
      : [];

    const rationale = recommended
      ? this.buildRecommendationRationale(
        user.goalMode,
        user.experienceLevel,
        recommended.name,
      )
      : 'No templates are currently available. You can still create a block and assign a template later.';

    return {
      recommended: transformWorkoutTemplate(recommended),
      alternatives: alternatives.map((t) => transformWorkoutTemplate(t)!),
      rationale,
      profile: {
        goalModeLabel: user.goalMode
          ? GOAL_MODE_LABELS[user.goalMode] ?? user.goalMode
          : null,
        experienceLevelLabel: user.experienceLevel
          ? EXPERIENCE_LEVEL_LABELS[user.experienceLevel] ?? user.experienceLevel
          : null,
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

  async findAll(userId: string) {
  return this.prisma.mesocycle.findMany({
    where: { userId },
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

  async getTemplates() {
    return this.prisma.workoutTemplate.findMany({
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
  }

  async expandToProgram(mesocycleId: string, userId: string) {
    const meso = await this.prisma.mesocycle.findFirst({
      where: { id: mesocycleId, userId },
      include: {
        workouts: {
          orderBy: [{ weekNumber: 'asc' }, { dayNumber: 'asc' }],
        },
      },
    });

    if (!meso) throw new NotFoundException(`Mesocycle ${mesocycleId} not found`);

    const weekMap = new Map<number, typeof meso.workouts>();
    for (const workout of meso.workouts) {
      const weekNumber = workout.weekNumber ?? 1;
      if (!weekMap.has(weekNumber)) weekMap.set(weekNumber, []);
      weekMap.get(weekNumber)!.push(workout);
    }

    const weeks = Array.from(weekMap.entries())
      .sort(([a], [b]) => a - b)
      .map(([weekNumber, days]) => {
        const isDeloadWeek = weekNumber === meso.totalWeeks;
        return {
          weekNumber,
          isDeloadWeek,
          label: isDeloadWeek ? `Week ${weekNumber} — Deload` : `Week ${weekNumber}`,
          days: days.map((workout) => {
            return {
              id: workout.id,
              dayNumber: workout.dayNumber ?? null,
              sessionType: workout.sessionType ?? workout.splitDayLabel ?? 'Session',
              date: workout.date ?? workout.scheduledDate ?? workout.completedAt ?? workout.createdAt,
              completed: workout.status === 'COMPLETED',
              prescription: workout.prescriptionSnapshot ?? null,
            };
          }),
        };
      });

    return {
      id: meso.id,
      name: meso.name,
      status: meso.status,
      weekCount: meso.totalWeeks,
      currentWeek: meso.currentWeek,
      startDate: meso.startDate,
      volumeTargets: meso.volumeTargets,
      weeks,
    };
  }

}
