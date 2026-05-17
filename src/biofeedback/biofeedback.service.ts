import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBiofeedbackDto } from './dto/create-biofeedback.dto';

const JOINT_COMFORT_MAP: Record<string, { score: number }> = {
  FEELS_GREAT: { score: 0 },
  FEELS_NORMAL: { score: 1 },
  SLIGHT_DISCOMFORT: { score: 3 },
  VERY_UNCOMFORTABLE: { score: 6 },
  SHARP_PAIN: { score: 9 },
};

const SORENESS_MAP: Record<string, { score: number }> = {
  NEVER_SORE:       { score: 0 },
  HEALED_LONG_AGO:  { score: 2 },
  HEALED_ON_TIME:   { score: 5 },
  STILL_SORE:       { score: 8 },
};

const VOLUME_MAP: Record<string, { signal: number }> = {
  NOT_ENOUGH:    { signal: 1 },
  JUST_RIGHT:    { signal: 0 },
  PUSHED_LIMITS: { signal: 0 },
  TOO_MUCH:      { signal: -1 },
};

const ALLOWED_JOINT_KEYS = new Set([
  'SHOULDER',
  'ELBOW',
  'WRIST',
  'HIP',
  'KNEE',
  'ANKLE',
  'LOWER_BACK',
]);

const ALLOWED_JOINT_SCORES = new Set([0, 1, 3, 6, 9]);

@Injectable()
export class BiofeedbackService {
  constructor(private prisma: PrismaService) {}

  async submit(userId: string, data: CreateBiofeedbackDto) {
    this.validateJointComfortLog(data.jointComfortLog);
    const jointComfortLogToPersist =
      data.globalJointComfortScore < 6 ? {} : data.jointComfortLog;

    const record = await this.prisma.bioFeedback.create({
      data: {
        userId,
        workoutId: data.workoutId ?? null,
        sorenessLog: data.sorenessLog as any,
        // TODO: jointComfortLog is now joint-keyed. buildJointPainMap() in workouts.service.ts should be simplified in a follow-up task to use joint keys directly.
        jointComfortLog: jointComfortLogToPersist as any,
        globalJointComfortScore: data.globalJointComfortScore,
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
            jointComfortScore: JOINT_COMFORT_MAP[mgf.jointComfort]?.score ?? 0,
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

  private validateJointComfortLog(jointComfortLog: Record<string, number>) {
    for (const [joint, score] of Object.entries(jointComfortLog ?? {})) {
      if (!ALLOWED_JOINT_KEYS.has(joint)) {
        throw new BadRequestException(
          `Invalid jointComfortLog key: ${joint}`,
        );
      }

      if (!Number.isInteger(score) || !ALLOWED_JOINT_SCORES.has(score)) {
        throw new BadRequestException(
          `Invalid jointComfortLog score for ${joint}: ${score}`,
        );
      }
    }
  }

  async getLatest(userId: string) {
    return this.prisma.bioFeedback.findFirst({
      where: { userId },
      orderBy: { loggedAt: 'desc' },
      include: { muscleGroupFeedback: true },
    });
  }

  async getPrePopulation(userId: string, workoutId: string) {
    const workout = await this.prisma.workout.findUnique({
      where: { id: workoutId },
      select: {
        id: true,
        bioFeedback: { select: { id: true } },
        sets: {
          select: {
            exercise: {
              select: { primaryMuscle: true },
            },
          },
        },
      },
    });

    if (!workout) {
      throw new NotFoundException('Workout not found');
    }

    const trainedMuscles = [
      ...new Set(workout.sets.map((set) => set.exercise.primaryMuscle)),
    ];
    const excludedBioFeedbackId = workout.bioFeedback?.id ?? null;

    return Promise.all(
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

  async getMusclesTrained(workoutId: string) {
    const sets = await this.prisma.set.findMany({
      where: { workoutId },
      include: { exercise: { select: { primaryMuscle: true } } },
    });

    const muscles = [...new Set(sets.map((s) => s.exercise.primaryMuscle))];
    return { workoutId, musclesTrainedToday: muscles };
  }
}