import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, SessionType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { GoalModeService } from '../goal-mode/goal-mode.service';
import { UsersService } from '../users/users.service';
import { TemplatesService } from '../templates/templates.service';
import { SFR_QUEUE } from '../workers/sfr.worker';
import { deriveDayLabel, deriveMuscleSummary } from './expand-day.utils';
import { toVolumeKey } from '../common/volume-key.util';

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

type VolumeTargetEntry = { mev: number; mrv: number; prescribed: number; current?: number };

function normalizeVolumeTargets(
  raw: Prisma.JsonValue | null | undefined,
): Record<string, VolumeTargetEntry> {
  if (!raw || typeof raw !== 'object') return {};
  const input = raw as Record<string, { mev?: number; mrv?: number; prescribed?: number; current?: number }>;
  const result: Record<string, VolumeTargetEntry> = {};
  for (const [muscle, entry] of Object.entries(input)) {
    const prescribed = entry.prescribed ?? entry.current ?? 0;
    result[muscle] = {
      mev: entry.mev ?? 0,
      mrv: entry.mrv ?? 0,
      prescribed,
      current: entry.current,
    };
  }
  return result;
}

function buildVolumeTargets(
  templateSetsByMuscle: Record<string, number>,
  musclePriorities?: Record<string, 'EMPHASIZE' | 'GROW' | 'MAINTAIN'>,
): Record<string, VolumeTargetEntry> {
  const result: Record<string, VolumeTargetEntry> = {};

  for (const [muscle, defaults] of Object.entries(MUSCLE_VOLUME_DEFAULTS)) {
    const priority = musclePriorities?.[muscle] ?? musclePriorities?.[muscle.toLowerCase()] ?? 'GROW';
    const templateSets = templateSetsByMuscle[muscle] ?? 0;
    const priorityTarget = applyMusclePriority(defaults.mev, defaults.mrv, priority);
    const prescribed = templateSets > 0 ? templateSets : priorityTarget;

    result[muscle] = {
      mev: defaults.mev,
      mrv: defaults.mrv,
      prescribed,
    };
  }
  return result;
}

async function sumTemplateSetsByMuscle(
  prisma: Pick<PrismaService, 'splitTemplate'>,
  templateId: string,
): Promise<Record<string, number>> {
  const template = await prisma.splitTemplate.findUnique({
    where: { id: templateId },
    include: {
      days: {
        include: {
          exercises: {
            include: { exercise: { select: { primaryMuscle: true } } },
          },
        },
      },
    },
  });
  const totals: Record<string, number> = {};
  for (const day of template?.days ?? []) {
    if (day.dayType !== 'WORKOUT') continue;
    for (const slot of day.exercises) {
      const key = toVolumeKey(slot.exercise.primaryMuscle);
      totals[key] = (totals[key] ?? 0) + slot.setsTarget;
    }
  }
  return totals;
}

@Injectable()
export class MesocyclesService {
  constructor(
    private prisma: PrismaService,
    private goalMode: GoalModeService,
    private users: UsersService,
    private templates: TemplatesService,
    @InjectQueue(SFR_QUEUE) private sfrQueue: Queue,
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

    let splitTemplateId: string;
    let mesocycleTemplateId: string | null = null;

    if (templateId) {
      const split = await this.prisma.splitTemplate.findUnique({
        where: { id: templateId },
        select: { id: true },
      });
      if (split) {
        splitTemplateId = split.id;
      } else {
        const mesoTemplate = await this.prisma.mesocycleTemplate.findUnique({
          where: { id: templateId },
          select: { id: true, splitTemplateId: true },
        });
        if (!mesoTemplate) {
          throw new BadRequestException('templateId not found');
        }
        splitTemplateId = mesoTemplate.splitTemplateId;
        mesocycleTemplateId = mesoTemplate.id;
      }
    } else {
      const fallback = await this.prisma.splitTemplate.findFirst({
        where: { isSystem: true },
        orderBy: { createdAt: 'asc' },
        select: { id: true },
      });
      if (!fallback) {
        throw new BadRequestException('No split template available');
      }
      splitTemplateId = fallback.id;
    }

    return this.prisma.mesocycle.create({
      data: {
        userId,
        name,
        totalWeeks: totalWeeks ?? 8,
        volumeTargets,
        splitTemplateId,
        mesocycleTemplateId,
        status: 'ACTIVE',
        currentWeek: 1,
      },
    });
  }

  private async generateFromTemplate(userId: string, dto: GenerateMesocycleDto) {
    const validation = await this.templates.validateTemplate(userId, dto.templateId);
    if (!validation.valid) {
      throw new BadRequestException({
        message: 'Template is incomplete and cannot be used to generate a block',
        errors: validation.errors,
      });
    }

    const tmpl = await this.templates.expand(dto.templateId);

    const durationWeeks = dto.overrideDurationWeeks ?? 8;

    if (Number.isNaN(durationWeeks) || durationWeeks < 1 || durationWeeks > 16) {
      throw new BadRequestException('durationWeeks must be between 1 and 16');
    }

    const templateSetsByMuscle = await sumTemplateSetsByMuscle(this.prisma, tmpl.id);
    const volumeTargets = buildVolumeTargets(templateSetsByMuscle, dto.musclePriorities);

    const mesocycle = await this.prisma.mesocycle.create({
      data: {
        userId,
        name: dto.name ?? tmpl.name,
        startDate: new Date(),
        totalWeeks: durationWeeks,
        currentWeek: 1,
        status: 'ACTIVE',
        volumeTargets,
        splitTemplateId: tmpl.id,
      },
    });

    const orderedDays = tmpl.splitConfigs
      .flatMap((split) => split.days)
      .filter((day) => day.dayType !== 'REST')
      .sort((a, b) => a.dayNumber - b.dayNumber);
    const workoutInserts: {
      userId: string;
      mesocycleId: string;
      splitDayLabel: string;
      sessionType: SessionType;
      splitDayId?: string;
      weekNumber: number;
      dayNumber: number;
      scheduledDate: Date;
      date: Date;
      status: 'PLANNED';
      prescriptionSnapshot: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput;
    }[] = [];

    for (let week = 1; week <= durationWeeks; week++) {
      for (const day of orderedDays) {
        const splitDay = day as typeof day & { id?: string };
        const prescriptionSnapshot = {
          templateId: tmpl.id,
          templateSlug: tmpl.slug,
          templateName: tmpl.name,
          splitType: tmpl.splitStyle,
          splitLabel: day.label,
          exercises: day.exercises.map((entry) => ({
            orderIndex: entry.orderIndex,
            exerciseId: (entry as typeof entry & { exerciseId?: string }).exerciseId ?? entry.exercise?.id ?? null,
            exerciseName: entry.exercise?.name ?? null,
            primaryMuscle: entry.exercise?.primaryMuscle ?? null,
            setsTarget: entry.setsTarget,
            repRangeMin: entry.repRangeMin,
            repRangeMax: entry.repRangeMax,
            rpeTarget: entry.rpeTarget,
          })),
        } as Prisma.InputJsonValue;

        const scheduledDate = new Date(
          mesocycle.startDate.getTime() +
            ((week - 1) * 7 + (day.dayNumber - 1)) * 24 * 60 * 60 * 1000,
        );

        workoutInserts.push({
          userId,
          mesocycleId: mesocycle.id,
          splitDayLabel: `W${week} D${day.dayNumber} - ${day.label}`,
          sessionType: SessionType.MESOCYCLE,
          splitDayId: splitDay.id,
          weekNumber: week,
          dayNumber: day.dayNumber,
          scheduledDate,
          date: scheduledDate,
          status: 'PLANNED',
          prescriptionSnapshot,
        });
      }
    }

    if (workoutInserts.length > 0) {
      await this.prisma.workout.createMany({ data: workoutInserts });

      const created = await this.prisma.workout.findMany({
        where: { mesocycleId: mesocycle.id },
        select: { id: true, splitDayId: true, weekNumber: true, dayNumber: true },
      });

      const workoutBySplitDayAndWeek = new Map(
        created
          .filter(
            (workout) =>
              workout.splitDayId &&
              workout.weekNumber !== null &&
              workout.dayNumber !== null,
          )
          .map((workout) => [
            `${workout.splitDayId}:${workout.weekNumber}:${workout.dayNumber}`,
            workout.id,
          ]),
      );

      const workoutExerciseInserts: Array<{
        workoutId: string;
        exerciseId: string;
        orderIndex: number;
        setsTarget: number;
        repRangeMin: number;
        repRangeMax: number;
        sourceExerciseId?: string;
      }> = [];

      for (let week = 1; week <= durationWeeks; week++) {
        for (const day of orderedDays) {
          const splitDay = day as typeof day & { id?: string };
          if (!splitDay.id) continue;

          const workoutId = workoutBySplitDayAndWeek.get(
            `${splitDay.id}:${week}:${day.dayNumber}`,
          );
          if (!workoutId) continue;

          for (const entry of day.exercises) {
            const exerciseId =
              (entry as typeof entry & { exerciseId?: string }).exerciseId ??
              entry.exercise?.id;
            if (!exerciseId) continue;

            workoutExerciseInserts.push({
              workoutId,
              exerciseId,
              orderIndex: entry.orderIndex,
              setsTarget: entry.setsTarget,
              repRangeMin: entry.repRangeMin,
              repRangeMax: entry.repRangeMax,
              sourceExerciseId: (entry as typeof entry & { id?: string }).id,
            });
          }
        }
      }

      if (workoutExerciseInserts.length > 0) {
        await this.prisma.workoutExercise.createMany({
          data: workoutExerciseInserts,
        });
      }
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

  async findActive(userId: string) {
    const mesocycle = await this.prisma.mesocycle.findFirst({
      where: { userId, status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
      include: {
        workouts: {
          where: { weekNumber: 1 },
          orderBy: [{ weekNumber: 'asc' }, { dayNumber: 'asc' }],
          select: {
            prescriptionSnapshot: true,
            splitDayLabel: true,
            weekNumber: true,
            dayNumber: true,
          },
        },
      },
    });
    return this.attachTemplateMetadata(mesocycle);
  }

  async findAll(userId: string) {
    const mesocycles = await this.prisma.mesocycle.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        workouts: {
          take: 1,
          orderBy: [{ weekNumber: 'asc' }, { dayNumber: 'asc' }],
          select: { prescriptionSnapshot: true },
        },
      },
    });
    return mesocycles.map((mesocycle) => this.attachTemplateMetadata(mesocycle));
  }

  async findOne(userId: string, id: string) {
    const mesocycle = await this.prisma.mesocycle.findFirst({
      where: { id, userId },
      include: {
        workouts: {
          take: 1,
          orderBy: [{ weekNumber: 'asc' }, { dayNumber: 'asc' }],
          select: { prescriptionSnapshot: true },
        },
      },
    });
    if (!mesocycle) throw new NotFoundException('Mesocycle not found');
    return this.attachTemplateMetadata(mesocycle);
  }

  async close(userId: string, id: string) {
    await this.findOne(userId, id);
    const mesocycle = await this.prisma.mesocycle.update({
      where: { id },
      data: { status: 'COMPLETED' },
    });
    await this.sfrQueue.add('calculate', { userId, mesocycleId: id }, {
      removeOnComplete: 100,
      removeOnFail: 50,
      jobId: `sfr:${id}`,
    });
    return mesocycle;
  }

  async getVolumeStatus(userId: string, id: string) {
    const mesocycle = await this.findOne(userId, id);
    if (!mesocycle) throw new NotFoundException('Mesocycle not found');

    const volumeTargets = normalizeVolumeTargets(mesocycle.volumeTargets as Prisma.JsonValue);
    const sets = await this.prisma.set.findMany({
      where: {
        workout: { mesocycleId: id, userId, status: 'COMPLETED' },
      },
      select: {
        exercise: { select: { primaryMuscle: true } },
        workout: { select: { weekNumber: true } },
      },
    });

    const blockTotal: Record<string, number> = {};
    const thisWeek: Record<string, number> = {};
    for (const row of sets) {
      const key = toVolumeKey(row.exercise.primaryMuscle);
      blockTotal[key] = (blockTotal[key] ?? 0) + 1;
      if ((row.workout.weekNumber ?? 1) === mesocycle.currentWeek) {
        thisWeek[key] = (thisWeek[key] ?? 0) + 1;
      }
    }

    const volumeActual: Record<string, { thisWeek: number; blockTotal: number }> = {};
    for (const muscle of new Set([...Object.keys(volumeTargets), ...Object.keys(blockTotal)])) {
      volumeActual[muscle] = {
        thisWeek: thisWeek[muscle] ?? 0,
        blockTotal: blockTotal[muscle] ?? 0,
      };
    }

    return {
      currentWeek: mesocycle.currentWeek,
      totalWeeks: mesocycle.totalWeeks,
      volumeTargets,
      volumeActual,
    };
  }

  async regenerateFromTemplate(userId: string, mesocycleId: string, splitTemplateId: string) {
    const meso = await this.prisma.mesocycle.findFirst({
      where: { id: mesocycleId, userId, status: 'ACTIVE' },
    });
    if (!meso) throw new NotFoundException('Active mesocycle not found');

    const ownedTemplate = await this.prisma.splitTemplate.findFirst({
      where: { id: splitTemplateId, userId, isSystem: false },
    });
    if (!ownedTemplate) {
      throw new BadRequestException('Regenerate requires an owned custom template');
    }

    const validation = await this.templates.validateTemplate(userId, splitTemplateId);
    if (!validation.valid) {
      throw new BadRequestException({ message: 'Template is invalid', errors: validation.errors });
    }

    await this.prisma.workout.deleteMany({
      where: {
        mesocycleId,
        userId,
        status: { in: ['PLANNED', 'IN_PROGRESS'] },
        weekNumber: { gte: meso.currentWeek },
      },
    });

    const tmpl = await this.templates.expand(splitTemplateId);
    const templateSetsByMuscle = await sumTemplateSetsByMuscle(this.prisma, splitTemplateId);
    const volumeTargets = buildVolumeTargets(templateSetsByMuscle);

    await this.prisma.mesocycle.update({
      where: { id: mesocycleId },
      data: { splitTemplateId, volumeTargets },
    });

    const orderedDays = tmpl.splitConfigs
      .flatMap((split) => split.days)
      .filter((day) => day.dayType !== 'REST')
      .sort((a, b) => a.dayNumber - b.dayNumber);

    const workoutInserts: {
      userId: string;
      mesocycleId: string;
      splitDayLabel: string;
      sessionType: SessionType;
      weekNumber: number;
      dayNumber: number;
      scheduledDate: Date;
      date: Date;
      status: 'PLANNED';
      prescriptionSnapshot: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput;
    }[] = [];
    for (let week = meso.currentWeek; week <= meso.totalWeeks; week++) {
      for (const day of orderedDays) {
        const prescriptionSnapshot = {
          templateId: tmpl.id,
          templateSlug: tmpl.slug,
          templateName: tmpl.name,
          splitType: tmpl.splitStyle,
          splitLabel: day.label,
          exercises: day.exercises.map((entry) => ({
            orderIndex: entry.orderIndex,
            exerciseId: entry.exerciseId ?? entry.exercise?.id ?? null,
            exerciseName: entry.exercise?.name ?? null,
            primaryMuscle: entry.exercise?.primaryMuscle ?? null,
            setsTarget: entry.setsTarget,
            repRangeMin: entry.repRangeMin,
            repRangeMax: entry.repRangeMax,
            rpeTarget: entry.rpeTarget,
          })),
        } as Prisma.InputJsonValue;

        const scheduledDate = new Date(
          meso.startDate.getTime() +
            ((week - 1) * 7 + (day.dayNumber - 1)) * 24 * 60 * 60 * 1000,
        );

        workoutInserts.push({
          userId,
          mesocycleId,
          splitDayLabel: `W${week} D${day.dayNumber} - ${day.label}`,
          sessionType: SessionType.MESOCYCLE,
          weekNumber: week,
          dayNumber: day.dayNumber,
          scheduledDate,
          date: scheduledDate,
          status: 'PLANNED' as const,
          prescriptionSnapshot,
        });
      }
    }

    if (workoutInserts.length > 0) {
      await this.prisma.workout.createMany({ data: workoutInserts });
    }

    return this.expandToProgram(mesocycleId, userId);
  }

  async getTemplates() {
    return this.prisma.splitTemplate.findMany({
      where: { isSystem: true },
      orderBy: [{ daysPerWeek: 'asc' }, { name: 'asc' }],
      include: {
        days: {
          orderBy: { dayNumber: 'asc' },
          include: {
            exercises: {
              orderBy: { orderIndex: 'asc' },
              include: {
                exercise: {
                  select: { id: true, name: true, primaryMuscle: true },
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
            const dayLabel = deriveDayLabel(
              workout.splitDayLabel,
              workout.prescriptionSnapshot,
            );
            return {
              id: workout.id,
              dayNumber: workout.dayNumber ?? null,
              dayLabel,
              muscleSummary: deriveMuscleSummary(workout.prescriptionSnapshot, dayLabel),
              sessionType: dayLabel,
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

  private attachTemplateMetadata<T extends { workouts?: Array<{ prescriptionSnapshot: Prisma.JsonValue | null }> }>(
    mesocycle: T | null,
  ): (T & { templateSplitType: string | null }) | null {
    if (!mesocycle) return null;
    const firstSnapshot = mesocycle.workouts?.[0]?.prescriptionSnapshot;
    const splitType =
      firstSnapshot && typeof firstSnapshot === 'object'
        ? (((firstSnapshot as { splitType?: string }).splitType ?? null) as string | null)
        : null;
    return {
      ...mesocycle,
      templateSplitType: splitType,
    };
  }

}
