import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const JOINT_PAIN_MAP: Record<string, { score: number }> = {
  NONE:     { score: 0 },
  LOW:      { score: 1 },
  MODERATE: { score: 2 },
  HIGH:     { score: 3 },
};

const SORENESS_MAP: Record<string, { score: number }> = {
  NEVER_SORE:       { score: 0 },
  HEALED_LONG_AGO:  { score: 2 },
  HEALED_ON_TIME:   { score: 5 },
  STILL_SORE:       { score: 8 },
};

const PUMP_MAP: Record<string, { score: number }> = {
  LOW:      { score: 2 },
  MODERATE: { score: 5 },
  AMAZING:  { score: 9 },
};

const VOLUME_MAP: Record<string, { signal: number }> = {
  NOT_ENOUGH:    { signal: 1 },
  JUST_RIGHT:    { signal: 0 },
  PUSHED_LIMITS: { signal: 0 },
  TOO_MUCH:      { signal: -1 },
};

@Injectable()
export class BiofeedbackService {
  constructor(private prisma: PrismaService) {}

  async submit(
    userId: string,
    data: {
      workoutId?: string;
      sorenessLog: Record<string, number>;
      jointPainLog: Record<string, number>;
      energyLevel: number;
      strengthRating: number;
      muscleFeel: number;
      sleepLastNight: number;
      overallWellbeing: number;
      muscleGroupFeedback?: {
        muscleGroup: string;
        jointPain: string;
        soreness: string;
        pump: string;
        volume: string;
      }[];
    },
  ) {
    const record = await this.prisma.bioFeedback.create({
      data: {
        userId,
        workoutId: data.workoutId ?? null,
        sorenessLog: data.sorenessLog as any,
        jointPainLog: data.jointPainLog as any,
        energyLevel: data.energyLevel,
        strengthRating: data.strengthRating,
        muscleFeel: data.muscleFeel,
        sleepLastNight: data.sleepLastNight,
        overallWellbeing: data.overallWellbeing,
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
            jointPain: mgf.jointPain,
            jointPainScore: JOINT_PAIN_MAP[mgf.jointPain]?.score ?? 0,
            soreness: mgf.soreness,
            sorenessScore: SORENESS_MAP[mgf.soreness]?.score ?? 0,
            pump: mgf.pump,
            pumpScore: PUMP_MAP[mgf.pump]?.score ?? 5,
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

  async getLatest(userId: string) {
    return this.prisma.bioFeedback.findFirst({
      where: { userId },
      orderBy: { loggedAt: 'desc' },
      include: { muscleGroupFeedback: true },
    });
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