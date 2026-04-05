import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface SubstitutionResult {
  action: 'NONE' | 'MONITOR' | 'SUBSTITUTE';
  substituteExerciseId?: string;
  substituteName?: string;
  reason: string;
}

@Injectable()
export class SubstitutionEngineService {
  constructor(private prisma: PrismaService) {}

  async evaluate(
    userId: string,
    exerciseId: string,
    jointPainLog: Record<string, number>,
  ): Promise<SubstitutionResult> {
    const exercise = await this.prisma.exercise.findUnique({
      where: { id: exerciseId },
      include: {
        substitutionPools: {
          include: { pool: true },
        },
      },
    });

    if (!exercise) {
      return { action: 'NONE', reason: 'Exercise not found' };
    }

    const painScores = Object.values(jointPainLog);
    const maxPain = painScores.length > 0 ? Math.max(...painScores) : 0;
    const painfulJoint = Object.entries(jointPainLog).find(
      ([, score]) => score === maxPain,
    )?.[0];

    if (maxPain <= 4) {
      return { action: 'NONE', reason: 'Pain within normal range' };
    }

    if (maxPain <= 6) {
      return {
        action: 'MONITOR',
        reason: `Joint pain score ${maxPain} — monitoring, load capped at RPE 8`,
      };
    }

    const poolIds = exercise.substitutionPools.map((sp) => sp.poolId);

    const candidate = await this.prisma.substitutionPoolExercise.findFirst({
      where: {
        poolId: { in: poolIds },
        exerciseId: { not: exerciseId },
        ...(painfulJoint && {
          suitableWhenPain: { has: painfulJoint },
        }),
      },
      orderBy: { priority: 'asc' },
      include: { exercise: true },
    });

    if (!candidate) {
      return {
        action: 'MONITOR',
        reason: `Pain score ${maxPain} but no substitute found — monitoring`,
      };
    }

    await this.prisma.exerciseSubstitution.create({
      data: {
        userId,
        originalExerciseId: exerciseId,
        substituteExerciseId: candidate.exerciseId,
        jointAffected: painfulJoint ?? 'UNKNOWN',
        painScoreAtSwap: maxPain,
        status: 'ACTIVE',
        phase: 1,
      },
    });

    return {
      action: 'SUBSTITUTE',
      substituteExerciseId: candidate.exerciseId,
      substituteName: candidate.exercise.name,
      reason: `Pain score ${maxPain} on ${painfulJoint} — substituting with ${candidate.exercise.name}`,
    };
  }

  async getActive(userId: string) {
    return this.prisma.exerciseSubstitution.findMany({
      where: { userId, status: 'ACTIVE' },
      include: {
        originalExercise: true,
        substituteExercise: true,
      },
    });
  }

  async review(userId: string, id: string, newPainScore: number) {
    const substitution = await this.prisma.exerciseSubstitution.findFirst({
      where: { id, userId },
    });

    if (!substitution) return null;

    if (newPainScore <= 3) {
      const nextPhase = substitution.phase + 1;
      if (nextPhase > 3) {
        return this.prisma.exerciseSubstitution.update({
          where: { id },
          data: { status: 'COMPLETED', updatedAt: new Date() },
        });
      }
      return this.prisma.exerciseSubstitution.update({
        where: { id },
        data: { phase: nextPhase, updatedAt: new Date() },
      });
    }

    return this.prisma.exerciseSubstitution.update({
      where: { id },
      data: { status: 'ACTIVE', updatedAt: new Date() },
    });
  }
}