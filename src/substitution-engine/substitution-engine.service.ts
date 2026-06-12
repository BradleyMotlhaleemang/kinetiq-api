import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import { MesocycleOverridesService } from '../mesocycles/mesocycle-overrides.service';

import { ConfirmSubstitutionDto } from './dto/confirm-substitution.dto';

import {
  resolveJointsForExercise,
  type JointAreaKey,
} from '../biofeedback/joint-map';

import {

  JOINT_PAIN_MONITOR_MAX,

  JOINT_PAIN_MONITOR_MIN,

} from '../biofeedback/joint-pain-scale';



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

  constructor(

    private prisma: PrismaService,

    private overrides: MesocycleOverridesService,

  ) {}



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



    const scopedLog = this.scopePainLogToExercise(jointPainLog, {

      primaryMuscle: exercise.primaryMuscle,

      secondaryMuscles: exercise.secondaryMuscles,

      movementPattern: exercise.movementPattern,

    });



    const painScores = Object.values(scopedLog);

    const maxPain = painScores.length > 0 ? Math.max(...painScores) : 0;

    const painfulJoint = Object.entries(scopedLog).find(

      ([, score]) => score === maxPain,

    )?.[0];



    if (maxPain < JOINT_PAIN_MONITOR_MIN) {

      return { action: 'NONE', reason: 'Pain within normal range' };

    }



    if (maxPain <= JOINT_PAIN_MONITOR_MAX) {

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



  private scopePainLogToExercise(

    jointPainLog: Record<string, number>,

    exercise: {

      primaryMuscle: string;

      secondaryMuscles: string[];

      movementPattern: string;

    },

  ): Record<string, number> {

    const relevant = new Set(

      resolveJointsForExercise({

        primaryMuscle: exercise.primaryMuscle,

        secondaryMuscles: exercise.secondaryMuscles,

        movementPattern: exercise.movementPattern,

      }),

    );



    const scoped: Record<string, number> = {};

    for (const [joint, score] of Object.entries(jointPainLog)) {

      if (relevant.has(joint as JointAreaKey)) {

        scoped[joint] = score;

      }

    }

    return scoped;

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



    const scope = data.scope ?? 'SESSION';

    await this.overrides.applySubstitutionScope(userId, {

      workoutId: data.workoutId,

      exerciseId: data.exerciseId,

      substituteExerciseId: data.substituteExerciseId,

      scope,

      source: 'PAIN',

      reason: `Pain on ${data.jointAffected}`,

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


