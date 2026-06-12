import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { mergeWorkoutJoints } from './joint-map';
import {
  isAllowedInternalJointScore,
  JOINT_TRIAGE_OUTCOMES,
  type JointTriageOutcome,
} from './joint-pain-scale';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBiofeedbackDto } from './dto/create-biofeedback.dto';

const SORENESS_MAP: Record<string, { score: number }> = {
  NEVER_SORE: { score: 0 },
  HEALED_LONG_AGO: { score: 2 },
  HEALED_ON_TIME: { score: 5 },
  STILL_SORE: { score: 8 },
};

const VOLUME_MAP: Record<string, { signal: number }> = {
  NOT_ENOUGH: { signal: 1 },
  JUST_RIGHT: { signal: 0 },
  PUSHED_LIMITS: { signal: 0 },
  TOO_MUCH: { signal: -1 },
};

const ALLOWED_JOINT_KEYS = new Set([
  'SHOULDER',
  'ELBOW',
  'WRIST',
  'NECK',
  'HIP',
  'KNEE',
  'ANKLE',
  'LOWER_BACK',
]);

@Injectable()
export class BiofeedbackService {
  constructor(private prisma: PrismaService) {}

  async submit(userId: string, data: CreateBiofeedbackDto) {
    const triage = this.resolveJointTriage(data);
    const jointComfortLogToPersist = this.normalizeJointComfortLog(
      data.jointComfortLog,
      triage,
    );

    const record = await this.prisma.bioFeedback.create({
      data: {
        userId,
        workoutId: data.workoutId ?? null,
        jointTriage: triage,
        sorenessLog: data.sorenessLog as any,
        jointComfortLog: jointComfortLogToPersist as any,
        globalJointComfortScore:
          triage === 'HEALTHY' ? 0 : data.globalJointComfortScore,
        trainingDrive: data.trainingDrive,
        sessionPerformance: data.sessionPerformance,
        pumpScore: data.pumpScore,
        ...(data.effortScore !== undefined && data.effortScore !== null
          ? { effortScore: data.effortScore }
          : {}),
      },
    });

    if (data.muscleGroupFeedback?.length) {
      for (const mgf of data.muscleGroupFeedback) {
        await this.prisma.muscleGroupFeedback.create({
          data: {
            bioFeedbackId: record.id,
            userId,
            workoutId: data.workoutId ?? '',
            muscleGroup: mgf.muscleGroup,
            jointComfort: mgf.jointComfort,
            jointComfortScore: 0,
            soreness: mgf.soreness,
            sorenessScore: SORENESS_MAP[mgf.soreness]?.score ?? 0,
            volume: mgf.volume,
            volumeSignal: VOLUME_MAP[mgf.volume]?.signal ?? 0,
          },
        });
      }
    }

    return this.prisma.bioFeedback.findUnique({
      where: { id: record.id },
      include: { muscleGroupFeedback: true },
    });
  }

  private resolveJointTriage(data: CreateBiofeedbackDto): JointTriageOutcome {
    if (
      data.jointTriage &&
      (JOINT_TRIAGE_OUTCOMES as readonly string[]).includes(data.jointTriage)
    ) {
      return data.jointTriage;
    }
    const keys = Object.keys(data.jointComfortLog ?? {});
    if (keys.length === 0) return 'HEALTHY';
    return 'MILD';
  }

  private normalizeJointComfortLog(
    raw: Record<string, unknown>,
    triage: JointTriageOutcome,
  ): Record<string, unknown> {
    if (triage === 'HEALTHY') {
      return {};
    }
    this.validateJointComfortLog(raw);
    const out: Record<string, unknown> = {};
    for (const [joint, value] of Object.entries(raw ?? {})) {
      const score = this.resolveJointScore(value);
      if (score !== null && score >= 1) {
        out[joint] = value;
      }
    }
    return out;
  }

  private validateJointComfortLog(jointComfortLog: Record<string, unknown>) {
    for (const [joint, value] of Object.entries(jointComfortLog ?? {})) {
      if (!ALLOWED_JOINT_KEYS.has(joint)) {
        throw new BadRequestException(
          `Invalid jointComfortLog key: ${joint}`,
        );
      }

      const score = this.resolveJointScore(value);
      if (score === null) {
        throw new BadRequestException(
          `Invalid jointComfortLog value for ${joint}`,
        );
      }
      if (!isAllowedInternalJointScore(score) && score !== 8) {
        throw new BadRequestException(
          `Invalid jointComfortLog score for ${joint}: ${score}`,
        );
      }
    }
  }

  private resolveJointScore(value: unknown): number | null {
    if (typeof value === 'number' && Number.isInteger(value)) {
      return value;
    }
    if (value && typeof value === 'object' && 'score' in value) {
      const score = (value as { score: unknown }).score;
      if (typeof score === 'number' && Number.isInteger(score)) {
        return score;
      }
    }
    return null;
  }

  async getLatest(userId: string) {
    return this.prisma.bioFeedback.findFirst({
      where: { userId },
      orderBy: { loggedAt: 'desc' },
      include: { muscleGroupFeedback: true },
    });
  }

  async getPrePopulation(userId: string, workoutId: string) {
    const workout = await this.prisma.workout.findFirst({
      where: { id: workoutId, userId },
      select: {
        id: true,
        bioFeedback: { select: { id: true } },
        sets: {
          select: {
            exerciseId: true,
            exercise: {
              select: {
                primaryMuscle: true,
                secondaryMuscles: true,
                movementPattern: true,
              },
            },
          },
        },
      },
    });

    if (!workout) {
      throw new NotFoundException('Workout not found');
    }

    const exerciseMeta = [
      ...new Map(
        workout.sets.map((set) => [set.exerciseId, set.exercise]),
      ).values(),
    ];

    const trainedMuscles = [
      ...new Set(
        workout.sets.flatMap((set) => [
          set.exercise.primaryMuscle,
          ...(set.exercise.secondaryMuscles ?? []),
        ]),
      ),
    ];

    const relevantJoints = mergeWorkoutJoints(
      exerciseMeta.map((exercise) => ({
        primaryMuscle: exercise.primaryMuscle,
        secondaryMuscles: exercise.secondaryMuscles ?? [],
        movementPattern: exercise.movementPattern,
      })),
    );
    const excludedBioFeedbackId = workout.bioFeedback?.id ?? null;

    const muscleItems = await Promise.all(
      trainedMuscles.map(async (muscle) => {
        const latestFeedback = await this.prisma.muscleGroupFeedback.findFirst({
          where: {
            userId,
            muscleGroup: muscle,
            ...(excludedBioFeedbackId
              ? { NOT: { bioFeedbackId: excludedBioFeedbackId } }
              : {}),
          },
          orderBy: { loggedAt: 'desc' },
          select: {
            soreness: true,
            sorenessScore: true,
          },
        });

        const lastSorenessLabel = latestFeedback?.soreness ?? null;
        const lastSorenessScore = latestFeedback?.sorenessScore ?? null;

        return {
          muscle,
          carrySoreness:
            typeof lastSorenessScore === 'number' && lastSorenessScore >= 5,
          lastSorenessLabel,
          lastSorenessScore,
        };
      }),
    );

    const recentJointHints = await this.getRecentJointPainHints(userId);

    return {
      muscles: muscleItems,
      relevantJoints,
      recentJointHints,
    };
  }

  private async getRecentJointPainHints(
    userId: string,
  ): Promise<Record<string, number>> {
    const recent = await this.prisma.bioFeedback.findMany({
      where: {
        userId,
        jointTriage: { in: ['MILD', 'SIGNIFICANT'] },
      },
      orderBy: { loggedAt: 'desc' },
      take: 3,
      select: { jointComfortLog: true },
    });

    const hints: Record<string, number> = {};
    for (const row of recent) {
      const log = row.jointComfortLog as Record<string, unknown>;
      for (const [joint, value] of Object.entries(log ?? {})) {
        const score =
          typeof value === 'number'
            ? value
            : value &&
                typeof value === 'object' &&
                'score' in value &&
                typeof (value as { score: unknown }).score === 'number'
              ? (value as { score: number }).score
              : 0;
        if (score >= 1) {
          hints[joint] = Math.max(hints[joint] ?? 0, score);
        }
      }
    }
    return hints;
  }

  async getSorenessHistory(userId: string, muscle: string) {
    const records = await this.prisma.bioFeedback.findMany({
      where: { userId },
      orderBy: { loggedAt: 'desc' },
      take: 14,
      include: { muscleGroupFeedback: { where: { muscleGroup: muscle } } },
    });

    return records.map((r) => ({
      loggedAt: r.loggedAt,
      soreness: (r.sorenessLog as Record<string, number>)[muscle] ?? 0,
      muscleGroupFeedback: r.muscleGroupFeedback[0] ?? null,
    }));
  }

  async get48hrOffset(userId: string) {
    const seventyTwoHoursAgo = new Date(Date.now() - 72 * 60 * 60 * 1000);
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    return this.prisma.bioFeedback.findFirst({
      where: {
        userId,
        loggedAt: { gte: seventyTwoHoursAgo, lte: twentyFourHoursAgo },
      },
      orderBy: { loggedAt: 'desc' },
      include: { muscleGroupFeedback: true },
    });
  }

  async getMusclesTrained(userId: string, workoutId: string) {
    const workout = await this.prisma.workout.findFirst({
      where: { id: workoutId, userId },
      select: { id: true },
    });
    if (!workout) {
      throw new NotFoundException('Workout not found');
    }

    const sets = await this.prisma.set.findMany({
      where: { workoutId },
      include: { exercise: { select: { primaryMuscle: true } } },
    });

    const muscles = [...new Set(sets.map((s) => s.exercise.primaryMuscle))];
    return { workoutId, musclesTrainedToday: muscles };
  }
}
