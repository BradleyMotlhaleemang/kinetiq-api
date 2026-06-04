import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfirmSubstitutionDto } from './dto/confirm-substitution.dto';

export interface SubstitutionResult {
  action: 'NONE' | 'MONITOR' | 'SUBSTITUTE';
  substituteExerciseId?: string;
  substituteName?: string;
  reason: string;
  candidates?: Array<{
    exerciseId: string;
    exerciseName: string;
    priority: number;
  }>;
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

    const candidates = await this.prisma.substitutionPoolExercise.findMany({
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

    const candidate = candidates[0] ?? null;

    if (!candidate) {
      return {
        action: 'MONITOR',
        reason: `Pain score ${maxPain} on ${painfulJoint ?? 'unknown joint'} — no suitable substitute found in pool`,
        candidates: [],
      };
    }

    // ExerciseSubstitution record is created only after user confirms
    // via the substitution confirmation endpoint (Task 2.3).

    return {
      action: 'SUBSTITUTE',
      substituteExerciseId: candidate.exerciseId,
      substituteName: candidate.exercise.name,
      reason: `Pain score ${maxPain} on ${painfulJoint} — substituting with ${candidate.exercise.name}`,
      candidates: candidates.map((c) => ({
        exerciseId: c.exerciseId,
        exerciseName: c.exercise.name,
        priority: c.priority,
      })),
    };
  }

  async confirmSubstitution(userId: string, data: ConfirmSubstitutionDto) {
    const substitution = await this.prisma.exerciseSubstitution.create({
      data: {
        userId,
        originalExerciseId: data.exerciseId,
        substituteExerciseId: data.substituteExerciseId,
        jointAffected: data.jointAffected,
        painScoreAtSwap: data.painScoreAtSwap ?? 0,
        status: 'ACTIVE',
        phase: 1,
      },
      include: {
        originalExercise: true,
        substituteExercise: true,
      },
    });

    await this.prisma.workoutExercise.updateMany({
      where: {
        workoutId: data.workoutId,
        exerciseId: data.exerciseId,
      },
      data: {
        exerciseId: data.substituteExerciseId,
      },
    });

    return substitution;
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