import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { mapPrismaError } from '../common/filters/prisma-exception.filter';
import { PrismaService } from '../prisma/prisma.service';
import { AdminAuditService } from './admin-audit.service';
import { TemplatesService } from '../templates/templates.service';
import { UpdateAdminExerciseDto } from './dto/update-admin-exercise.dto';
import { CreateAdminExerciseDto } from './dto/create-admin-exercise.dto';
import { UpdateMesocycleTemplateDto } from './dto/update-mesocycle-template.dto';
import { UpdateAdminUserDto } from './dto/update-admin-user.dto';
import { UpdateRoutineTemplateDto } from './dto/update-routine-template.dto';
import { ReplaceRoutineDaysDto } from './dto/replace-routine-days.dto';
import {
  CreateSubstitutionPoolDto,
  UpdateSubstitutionPoolDto,
  UpsertPoolExerciseDto,
} from './dto/substitution-pool.dto';
import {
  CreateKnowledgeDto,
  UpdateKnowledgeDto,
  UpdateAnnouncementDto,
} from './dto/knowledge-admin.dto';
import { ExercisesService } from '../exercises/exercises.service';

const ANNOUNCEMENT_KEY = 'announcement_banner';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private audit: AdminAuditService,
    private templates: TemplatesService,
    private exercises: ExercisesService,
  ) {}

  private async invalidateExerciseCatalog(): Promise<void> {
    await this.exercises.invalidateCatalogCache();
  }

  private async invalidateTemplateCatalog(): Promise<void> {
    await this.templates.invalidateCatalogCache();
  }

  async getStats() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [
      templateCount,
      exerciseCount,
      activeUsers,
      workoutsLogged,
    ] = await Promise.all([
      this.prisma.mesocycleTemplate.count(),
      this.prisma.exercise.count(),
      this.prisma.user.count({
        where: {
          workouts: {
            some: { startedAt: { gte: thirtyDaysAgo } },
          },
        },
      }),
      this.prisma.workout.count({
        where: { status: 'COMPLETED', completedAt: { gte: thirtyDaysAgo } },
      }),
    ]);

    return { templateCount, exerciseCount, activeUsers, workoutsLogged };
  }

  async getActivity() {
    const result = await this.audit.list({ limit: 25 });
    return result.items;
  }

  async listAudit(params: {
    limit?: number;
    offset?: number;
    actorId?: string;
    entityType?: string;
    from?: string;
    to?: string;
  }) {
    return this.audit.list({
      limit: params.limit,
      offset: params.offset,
      actorId: params.actorId,
      entityType: params.entityType,
      from: params.from ? new Date(params.from) : undefined,
      to: params.to ? new Date(params.to) : undefined,
    });
  }

  // ─── Users ───────────────────────────────────────────────────────────────

  async listUsers(params: { search?: string; limit?: number; offset?: number }) {
    const limit = params.limit ?? 50;
    const offset = params.offset ?? 0;
    const where = params.search
      ? {
          OR: [
            { email: { contains: params.search, mode: 'insensitive' as const } },
            { displayName: { contains: params.search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        select: {
          id: true,
          email: true,
          displayName: true,
          role: true,
          accountStatus: true,
          emailVerified: true,
          experienceLevel: true,
          createdAt: true,
          lastLoginAt: true,
          lastActiveAt: true,
          lockedUntil: true,
          mesocycles: {
            where: { status: 'ACTIVE' },
            take: 1,
            select: { id: true, name: true, currentWeek: true, totalWeeks: true },
          },
          _count: {
            select: {
              workouts: { where: { status: 'COMPLETED' } },
              mesocycles: { where: { status: 'COMPLETED' } },
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const userIds = users.map((user) => user.id);
    const workouts30dByUser =
      userIds.length === 0
        ? []
        : await this.prisma.workout.groupBy({
            by: ['userId'],
            where: {
              userId: { in: userIds },
              status: 'COMPLETED',
              completedAt: { gte: thirtyDaysAgo },
            },
            _count: { id: true },
          });
    const workouts30dMap = new Map(
      workouts30dByUser.map((row) => [row.userId, row._count.id]),
    );

    const enriched = users.map((user) => ({
      ...user,
      activeMesocycle: user.mesocycles[0] ?? null,
      programsCompleted: user._count.mesocycles,
      workoutsCompleted: user._count.workouts,
      workouts30d: workouts30dMap.get(user.id) ?? 0,
    }));

    return { items: enriched, total };
  }

  async getUser(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        accountStatus: true,
        emailVerified: true,
        experienceLevel: true,
        goalMode: true,
        createdAt: true,
        lastLoginAt: true,
        lastActiveAt: true,
        lockedUntil: true,
        failedLoginAttempts: true,
        onboardingCompletedAt: true,
        classificationCompletedAt: true,
        recommendedLevel: true,
        mesocycles: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            name: true,
            status: true,
            currentWeek: true,
            totalWeeks: true,
            startDate: true,
            mesocycleTemplate: { select: { name: true } },
          },
        },
        workouts: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            status: true,
            startedAt: true,
            completedAt: true,
            splitDayLabel: true,
          },
        },
        exerciseSubstitutions: {
          where: { status: 'ACTIVE' },
          include: {
            originalExercise: { select: { name: true } },
            substituteExercise: { select: { name: true } },
          },
        },
      },
    });
    if (!user) throw new NotFoundException('User not found');

    const authEvents = await this.prisma.authAuditLog.findMany({
      where: { userId: id },
      orderBy: { createdAt: 'desc' },
      take: 15,
    });

    return { ...user, authEvents };
  }

  async updateUser(actorId: string, id: string, dto: UpdateAdminUserDto) {
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('User not found');

    const data: Record<string, unknown> = {};
    if (dto.accountStatus !== undefined) data.accountStatus = dto.accountStatus;
    if (dto.forceVerifyEmail) {
      data.emailVerified = true;
      data.emailVerificationToken = null;
      data.emailVerificationTokenExpiry = null;
    }
    if (dto.unlock) {
      data.lockedUntil = null;
      data.failedLoginAttempts = 0;
      data.accountStatus = 'ACTIVE';
    }

    const user = await this.prisma.user.update({ where: { id }, data });
    await this.audit.log(actorId, 'User', id, 'UPDATED', existing.email);
    return user;
  }

  // ─── Exercises ───────────────────────────────────────────────────────────

  async listExercises(search?: string) {
    return this.prisma.exercise.findMany({
      where: search
        ? { name: { contains: search, mode: 'insensitive' } }
        : undefined,
      include: {
        metadata: { include: { equipmentProfile: true, executionProfile: true } },
        substitutionPools: { include: { pool: true }, orderBy: { priority: 'asc' } },
        _count: { select: { sets: true } },
      },
      orderBy: { name: 'asc' },
      take: 200,
    });
  }

  async getExercise(id: string) {
    const exercise = await this.prisma.exercise.findUnique({
      where: { id },
      include: {
        metadata: { include: { equipmentProfile: true, executionProfile: true } },
        substitutionPools: { include: { pool: true }, orderBy: { priority: 'asc' } },
      },
    });
    if (!exercise) throw new NotFoundException('Exercise not found');
    return exercise;
  }

  async createExercise(actorId: string, dto: CreateAdminExerciseDto) {
    const exercise = await this.prisma.exercise.create({
      data: {
        name: dto.name.trim(),
        primaryMuscle: dto.primaryMuscle,
        secondaryMuscles: dto.secondaryMuscles ?? [],
        movementPattern: dto.movementPattern,
        exerciseType: dto.exerciseType,
        movementClass: dto.movementClass ?? null,
        category: dto.category ?? 'PRIMARY_COMPOUND',
        isCompound: dto.exerciseType === 'COMPOUND',
        metadata: {
          create: {
            equipmentProfileId: dto.equipmentProfileId,
            executionProfileId: dto.executionProfileId,
            fatigueScore: dto.fatigueScore ?? 5,
            stabilityDemand: dto.stabilityDemand ?? 5,
            methodFatigueMultiplier: dto.methodFatigueMultiplier ?? 1,
          },
        },
      },
      include: {
        metadata: { include: { equipmentProfile: true, executionProfile: true } },
        substitutionPools: { include: { pool: true } },
      },
    });
    await this.audit.log(actorId, 'Exercise', exercise.id, 'CREATED', exercise.name);
    await this.invalidateExerciseCatalog();
    return exercise;
  }

  async updateExercise(actorId: string, id: string, dto: UpdateAdminExerciseDto) {
    const existing = await this.prisma.exercise.findUnique({
      where: { id },
      include: { metadata: true },
    });
    if (!existing) throw new NotFoundException('Exercise not found');

    const metadataUpdate: Record<string, unknown> = {};
    if (dto.equipmentProfileId !== undefined) metadataUpdate.equipmentProfileId = dto.equipmentProfileId;
    if (dto.executionProfileId !== undefined) metadataUpdate.executionProfileId = dto.executionProfileId;
    if (dto.fatigueScore !== undefined) metadataUpdate.fatigueScore = dto.fatigueScore;
    if (dto.stabilityDemand !== undefined) metadataUpdate.stabilityDemand = dto.stabilityDemand;
    if (dto.methodFatigueMultiplier !== undefined) {
      metadataUpdate.methodFatigueMultiplier = dto.methodFatigueMultiplier;
    }

    const exercise = await this.prisma.exercise.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.primaryMuscle !== undefined ? { primaryMuscle: dto.primaryMuscle } : {}),
        ...(dto.secondaryMuscles !== undefined ? { secondaryMuscles: dto.secondaryMuscles } : {}),
        ...(dto.movementPattern !== undefined ? { movementPattern: dto.movementPattern } : {}),
        ...(dto.exerciseType !== undefined ? { exerciseType: dto.exerciseType } : {}),
        ...(dto.movementClass !== undefined ? { movementClass: dto.movementClass } : {}),
        ...(dto.category !== undefined ? { category: dto.category } : {}),
        ...(dto.chestRegion !== undefined ? { chestRegion: dto.chestRegion } : {}),
        ...(dto.inclineAngleDegrees !== undefined
          ? { inclineAngleDegrees: dto.inclineAngleDegrees }
          : {}),
        ...(Object.keys(metadataUpdate).length > 0 && existing.metadata
          ? { metadata: { update: metadataUpdate } }
          : {}),
      },
      include: {
        metadata: { include: { equipmentProfile: true, executionProfile: true } },
        substitutionPools: { include: { pool: true }, orderBy: { priority: 'asc' } },
      },
    });

    await this.audit.log(actorId, 'Exercise', id, 'UPDATED', dto.name ?? existing.name);
    await this.invalidateExerciseCatalog();
    return exercise;
  }

  async deleteExercise(actorId: string, id: string) {
    const existing = await this.prisma.exercise.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Exercise not found');

    const inUse = await this.prisma.splitDayExercise.count({ where: { exerciseId: id } });
    if (inUse > 0) {
      throw new BadRequestException(
        `Exercise is referenced in ${inUse} template slot(s). Remove from templates first.`,
      );
    }

    await this.prisma.exercise.delete({ where: { id } });
    await this.audit.log(actorId, 'Exercise', id, 'DELETED', existing.name);
    await this.invalidateExerciseCatalog();
    return { deleted: true };
  }

  async listEquipmentProfiles() {
    return this.prisma.equipmentProfile.findMany({ orderBy: { name: 'asc' } });
  }

  async listExecutionProfiles() {
    return this.prisma.executionProfile.findMany({ orderBy: { zone: 'asc' } });
  }

  // ─── Substitution pools ──────────────────────────────────────────────────

  async listSubstitutionPools() {
    return this.prisma.substitutionPool.findMany({
      include: {
        exercises: {
          include: { exercise: { select: { id: true, name: true } } },
          orderBy: { priority: 'asc' },
        },
        _count: { select: { exercises: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async createSubstitutionPool(actorId: string, dto: CreateSubstitutionPoolDto) {
    const pool = await this.prisma.substitutionPool.create({ data: dto });
    await this.audit.log(actorId, 'SubstitutionPool', pool.id, 'CREATED', pool.name);
    await this.invalidateExerciseCatalog();
    return pool;
  }

  async updateSubstitutionPool(
    actorId: string,
    id: string,
    dto: UpdateSubstitutionPoolDto,
  ) {
    const pool = await this.prisma.substitutionPool.update({ where: { id }, data: dto });
    await this.audit.log(actorId, 'SubstitutionPool', id, 'UPDATED', pool.name);
    await this.invalidateExerciseCatalog();
    return pool;
  }

  async deleteSubstitutionPool(actorId: string, id: string) {
    const existing = await this.prisma.substitutionPool.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Pool not found');
    await this.prisma.substitutionPoolExercise.deleteMany({ where: { poolId: id } });
    await this.prisma.substitutionPool.delete({ where: { id } });
    await this.audit.log(actorId, 'SubstitutionPool', id, 'DELETED', existing.name);
    await this.invalidateExerciseCatalog();
    return { deleted: true };
  }

  async upsertPoolExercise(
    actorId: string,
    poolId: string,
    dto: UpsertPoolExerciseDto,
  ) {
    const pool = await this.prisma.substitutionPool.findUnique({ where: { id: poolId } });
    if (!pool) throw new NotFoundException('Pool not found');

    const entry = await this.prisma.substitutionPoolExercise.upsert({
      where: { poolId_exerciseId: { poolId, exerciseId: dto.exerciseId } },
      create: {
        poolId,
        exerciseId: dto.exerciseId,
        priority: dto.priority,
        suitableWhenPain: dto.suitableWhenPain ?? [],
      },
      update: {
        priority: dto.priority,
        suitableWhenPain: dto.suitableWhenPain ?? [],
      },
      include: { exercise: { select: { id: true, name: true } } },
    });
    await this.audit.log(
      actorId,
      'SubstitutionPoolExercise',
      entry.id,
      'UPDATED',
      `${pool.name}: ${entry.exercise.name}`,
    );
    await this.invalidateExerciseCatalog();
    return entry;
  }

  async removePoolExercise(actorId: string, poolId: string, exerciseId: string) {
    const entry = await this.prisma.substitutionPoolExercise.findUnique({
      where: { poolId_exerciseId: { poolId, exerciseId } },
    });
    if (!entry) throw new NotFoundException('Pool membership not found');
    await this.prisma.substitutionPoolExercise.delete({
      where: { poolId_exerciseId: { poolId, exerciseId } },
    });
    await this.audit.log(actorId, 'SubstitutionPoolExercise', entry.id, 'DELETED');
    await this.invalidateExerciseCatalog();
    return { deleted: true };
  }

  // ─── Templates ───────────────────────────────────────────────────────────

  async listProgramTemplates() {
    return this.prisma.mesocycleTemplate.findMany({
      include: {
        splitTemplate: {
          select: {
            id: true,
            name: true,
            level: true,
            goal: true,
            isSystem: true,
            daysPerWeek: true,
            _count: { select: { days: true } },
          },
        },
        _count: { select: { mesocycles: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async getProgramTemplate(id: string) {
    const template = await this.prisma.mesocycleTemplate.findUnique({
      where: { id },
      include: {
        splitTemplate: {
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
        },
        _count: { select: { mesocycles: { where: { status: 'ACTIVE' } } } },
      },
    });
    if (!template) throw new NotFoundException('Program template not found');
    return template;
  }

  async listRoutineTemplates() {
    return this.prisma.splitTemplate.findMany({
      where: { isSystem: true },
      include: { _count: { select: { days: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async getRoutineTemplate(id: string) {
    const routine = await this.prisma.splitTemplate.findFirst({
      where: { id, isSystem: true },
      include: {
        days: {
          orderBy: { dayNumber: 'asc' },
          include: {
            exercises: {
              orderBy: { orderIndex: 'asc' },
              include: {
                exercise: { select: { id: true, name: true, primaryMuscle: true } },
              },
            },
          },
        },
        mesocycleTemplates: { take: 1 },
      },
    });
    if (!routine) throw new NotFoundException('Routine template not found');
    return routine;
  }

  async updateMesocycleTemplate(
    actorId: string,
    id: string,
    dto: UpdateMesocycleTemplateDto,
  ) {
    const existing = await this.prisma.mesocycleTemplate.findUnique({
      where: { id },
      include: { splitTemplate: true },
    });
    if (!existing) throw new NotFoundException('Program template not found');

    const template = await this.prisma.mesocycleTemplate.update({
      where: { id },
      data: {
        ...(dto.featured !== undefined ? { featured: dto.featured } : {}),
        ...(dto.progressionNotes !== undefined ? { progressionNotes: dto.progressionNotes } : {}),
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.level !== undefined ? { level: dto.level } : {}),
        ...(dto.goal !== undefined ? { goal: dto.goal } : {}),
        ...(dto.durationWeeksMin !== undefined ? { durationWeeksMin: dto.durationWeeksMin } : {}),
        ...(dto.durationWeeksMax !== undefined ? { durationWeeksMax: dto.durationWeeksMax } : {}),
        ...(dto.progressionType !== undefined ? { progressionType: dto.progressionType } : {}),
        ...(dto.deloadWeek !== undefined ? { deloadWeek: dto.deloadWeek } : {}),
        ...(dto.deloadNotes !== undefined ? { deloadNotes: dto.deloadNotes } : {}),
        ...(dto.difficultyWarning !== undefined ? { difficultyWarning: dto.difficultyWarning } : {}),
        ...(dto.isPublished !== undefined ? { isPublished: dto.isPublished } : {}),
      },
      include: {
        splitTemplate: {
          select: {
            id: true,
            name: true,
            level: true,
            goal: true,
            isSystem: true,
            daysPerWeek: true,
            _count: { select: { days: true } },
          },
        },
      },
    });

    if (dto.name && existing.splitTemplate) {
      await this.prisma.splitTemplate.update({
        where: { id: existing.splitTemplateId },
        data: { name: dto.name },
      });
    }

    await this.audit.log(actorId, 'MesocycleTemplate', id, 'UPDATED', template.name);
    await this.invalidateTemplateCatalog();
    return template;
  }

  async updateRoutineTemplate(
    actorId: string,
    id: string,
    dto: UpdateRoutineTemplateDto,
  ) {
    await this.templates.assertSystemTemplate(id);
    const routine = await this.templates.updateSystemMetadata(id, dto);
    await this.audit.log(actorId, 'SplitTemplate', id, 'UPDATED', routine.name);
    await this.invalidateTemplateCatalog();
    return routine;
  }

  async replaceRoutineDays(actorId: string, id: string, dto: ReplaceRoutineDaysDto) {
    const routine = await this.templates.replaceSystemDays(id, dto.days);
    await this.audit.log(actorId, 'SplitTemplate', id, 'UPDATED', `${routine.name} days`);
    await this.invalidateTemplateCatalog();
    return routine;
  }

  async duplicateProgram(actorId: string, id: string) {
    const source = await this.getProgramTemplate(id);
    const slug = `${source.slug}-copy-${Date.now()}`;
    const splitName = await this.templates.resolveUniqueSplitTemplateName(
      `${source.splitTemplate.name} (Copy)`,
    );

    try {
    const split = await this.prisma.splitTemplate.create({
      data: {
        slug,
        name: splitName,
        level: source.level,
        goal: source.goal,
        primaryMuscle: source.splitTemplate.primaryMuscle,
        isSystem: true,
        splitLabel: source.splitTemplate.splitLabel,
        splitType: source.splitTemplate.splitType,
        daysPerWeek: source.splitTemplate.daysPerWeek,
        description: source.splitTemplate.description,
        goalTags: source.splitTemplate.goalTags,
        experienceTags: source.splitTemplate.experienceTags,
        days: {
          create: source.splitTemplate.days.map((day) => ({
            dayNumber: day.dayNumber,
            dayType: day.dayType,
            label: day.label,
            ...(day.dayType === 'WORKOUT'
              ? {
                  exercises: {
                    create: day.exercises.map((ex) => ({
                      exerciseId: ex.exerciseId,
                      orderIndex: ex.orderIndex,
                      setsTarget: ex.setsTarget,
                      repRangeMin: ex.repRangeMin,
                      repRangeMax: ex.repRangeMax,
                      rpeTarget: ex.rpeTarget,
                    })),
                  },
                }
              : {}),
          })),
        },
      },
    });

    const program = await this.prisma.mesocycleTemplate.create({
      data: {
        slug,
        name: splitName.replace(source.splitTemplate.name, source.name),
        level: source.level,
        goal: source.goal,
        splitTemplateId: split.id,
        durationWeeksMin: source.durationWeeksMin,
        durationWeeksMax: source.durationWeeksMax,
        progressionType: source.progressionType,
        progressionNotes: source.progressionNotes,
        deloadWeek: source.deloadWeek,
        deloadNotes: source.deloadNotes,
        difficultyWarning: source.difficultyWarning,
        featured: false,
        isPublished: false,
      },
      include: { splitTemplate: true },
    });

    await this.audit.log(actorId, 'MesocycleTemplate', program.id, 'CREATED', program.name);
    await this.invalidateTemplateCatalog();
    return program;
    } catch (error) {
      mapPrismaError(error);
    }
  }

  async deleteProgramTemplate(actorId: string, id: string) {
    const template = await this.prisma.mesocycleTemplate.findUnique({
      where: { id },
      include: {
        splitTemplate: true,
        _count: { select: { mesocycles: true } },
      },
    });
    if (!template) throw new NotFoundException('Program template not found');
    if (!template.splitTemplate.isSystem) {
      throw new BadRequestException('Only system program templates can be deleted from admin');
    }

    const activeMesocycles = await this.prisma.mesocycle.count({
      where: { mesocycleTemplateId: id, status: 'ACTIVE' },
    });
    if (activeMesocycles > 0) {
      throw new BadRequestException(
        `Cannot delete: ${activeMesocycles} user block(s) are actively using this program.`,
      );
    }

    if (template._count.mesocycles > 0) {
      throw new BadRequestException(
        `Cannot delete: ${template._count.mesocycles} user block(s) were created from this program. Unpublish instead.`,
      );
    }

    const splitTemplateId = template.splitTemplateId;
    const programName = template.name;

    await this.prisma.$transaction(async (tx) => {
      await tx.mesocycleTemplate.delete({ where: { id } });

      const splitStillUsed =
        (await tx.mesocycle.count({ where: { splitTemplateId } })) > 0 ||
        (await tx.workout.count({ where: { splitTemplateId } })) > 0 ||
        (await tx.mesocycleTemplate.count({ where: { splitTemplateId } })) > 0;

      if (!splitStillUsed) {
        const dayIds = (
          await tx.splitDay.findMany({
            where: { splitTemplateId },
            select: { id: true },
          })
        ).map((d) => d.id);

        if (dayIds.length > 0) {
          await tx.splitDayExercise.deleteMany({ where: { splitDayId: { in: dayIds } } });
          await tx.splitDay.deleteMany({ where: { splitTemplateId } });
        }

        await tx.splitTemplate.delete({ where: { id: splitTemplateId } });
      }
    });

    await this.audit.log(actorId, 'MesocycleTemplate', id, 'DELETED', programName);
    await this.invalidateTemplateCatalog();
    return { deleted: true };
  }

  // ─── Analytics ───────────────────────────────────────────────────────────

  async getAnalytics() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      newUsers30d,
      dau,
      wau,
      workoutsCompleted30d,
      templateStarts,
      topExercises,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      this.prisma.user.count({
        where: { lastActiveAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
      }),
      this.prisma.user.count({ where: { lastActiveAt: { gte: sevenDaysAgo } } }),
      this.prisma.workout.count({
        where: { status: 'COMPLETED', completedAt: { gte: thirtyDaysAgo } },
      }),
      this.prisma.mesocycle.groupBy({
        by: ['mesocycleTemplateId'],
        _count: { id: true },
        where: { mesocycleTemplateId: { not: null }, createdAt: { gte: thirtyDaysAgo } },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),
      this.prisma.set.groupBy({
        by: ['exerciseId'],
        _count: { id: true },
        where: { workout: { completedAt: { gte: thirtyDaysAgo } } },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),
    ]);

    const templateIds = templateStarts
      .map((t) => t.mesocycleTemplateId)
      .filter((id): id is string => id !== null);
    const templates = templateIds.length
      ? await this.prisma.mesocycleTemplate.findMany({
          where: { id: { in: templateIds } },
          select: { id: true, name: true },
        })
      : [];
    const templateMap = new Map(templates.map((t) => [t.id, t.name]));

    const exerciseIds = topExercises.map((e) => e.exerciseId);
    const exercises = exerciseIds.length
      ? await this.prisma.exercise.findMany({
          where: { id: { in: exerciseIds } },
          select: { id: true, name: true },
        })
      : [];
    const exerciseMap = new Map(exercises.map((e) => [e.id, e.name]));

    return {
      totalUsers,
      newUsers30d,
      dau,
      wau,
      workoutsCompleted30d,
      templatePopularity: templateStarts.map((t) => ({
        templateId: t.mesocycleTemplateId,
        name: t.mesocycleTemplateId
          ? templateMap.get(t.mesocycleTemplateId) ?? 'Unknown'
          : 'Custom',
        starts: t._count.id,
      })),
      topExercises: topExercises.map((e) => ({
        exerciseId: e.exerciseId,
        name: exerciseMap.get(e.exerciseId) ?? 'Unknown',
        setCount: e._count.id,
      })),
    };
  }

  // ─── Knowledge & announcements ───────────────────────────────────────────

  async listKnowledge() {
    return this.prisma.knowledgeEntry.findMany({ orderBy: { updatedAt: 'desc' } });
  }

  async createKnowledge(actorId: string, dto: CreateKnowledgeDto) {
    const entry = await this.prisma.knowledgeEntry.create({ data: dto });
    await this.audit.log(actorId, 'KnowledgeEntry', entry.id, 'CREATED', entry.title);
    return entry;
  }

  async updateKnowledge(actorId: string, id: string, dto: UpdateKnowledgeDto) {
    const entry = await this.prisma.knowledgeEntry.update({ where: { id }, data: dto });
    await this.audit.log(actorId, 'KnowledgeEntry', id, 'UPDATED', entry.title);
    return entry;
  }

  async deleteKnowledge(actorId: string, id: string) {
    const existing = await this.prisma.knowledgeEntry.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Knowledge entry not found');
    await this.prisma.knowledgeEntry.delete({ where: { id } });
    await this.audit.log(actorId, 'KnowledgeEntry', id, 'DELETED', existing.title);
    return { deleted: true };
  }

  async getAnnouncement() {
    const setting = await this.prisma.appSetting.findUnique({
      where: { key: ANNOUNCEMENT_KEY },
    });
    return setting?.value ?? { message: '', enabled: false };
  }

  async updateAnnouncement(actorId: string, dto: UpdateAnnouncementDto) {
    const value = { message: dto.message, enabled: dto.enabled ?? true };
    const setting = await this.prisma.appSetting.upsert({
      where: { key: ANNOUNCEMENT_KEY },
      create: { key: ANNOUNCEMENT_KEY, value },
      update: { value },
    });
    await this.audit.log(actorId, 'AppSetting', ANNOUNCEMENT_KEY, 'UPDATED', 'announcement');
    return setting.value;
  }
}
