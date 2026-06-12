import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExerciseOverrideDto } from './dto/create-exercise-override.dto';

type PrescriptionSnapshot = {
  exercises?: Array<{
    exerciseId?: string | null;
    exerciseName?: string | null;
    orderIndex?: number;
  }>;
};

@Injectable()
export class MesocycleOverridesService {
  constructor(private readonly prisma: PrismaService) {}

  async listOverrides(userId: string, mesocycleId: string) {
    await this.assertMesocycleOwner(userId, mesocycleId);
    return this.prisma.mesocycleExerciseOverride.findMany({
      where: { mesocycleId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createOverride(
    userId: string,
    mesocycleId: string,
    dto: CreateExerciseOverrideDto,
  ) {
    await this.assertMesocycleOwner(userId, mesocycleId);

    const slot = await this.prisma.splitDayExercise.findUnique({
      where: { id: dto.splitDayExerciseId },
      include: { exercise: true },
    });
    if (!slot) {
      throw new NotFoundException(`Slot ${dto.splitDayExerciseId} not found`);
    }

    if (dto.scope === 'SESSION') {
      if (!dto.workoutId) {
        throw new BadRequestException('workoutId is required for SESSION scope');
      }
      await this.applySessionSwap(
        mesocycleId,
        dto.workoutId,
        slot.id,
        slot.exerciseId,
        dto.substituteExerciseId,
      );
      return { scope: 'SESSION', applied: true };
    }

    const override = await this.prisma.mesocycleExerciseOverride.upsert({
      where: {
        mesocycleId_splitDayExerciseId: {
          mesocycleId,
          splitDayExerciseId: dto.splitDayExerciseId,
        },
      },
      create: {
        mesocycleId,
        splitDayExerciseId: dto.splitDayExerciseId,
        originalExerciseId: slot.exerciseId,
        substituteExerciseId: dto.substituteExerciseId,
        source: dto.source ?? 'MANUAL',
        reason: dto.reason,
      },
      update: {
        substituteExerciseId: dto.substituteExerciseId,
        source: dto.source ?? 'MANUAL',
        reason: dto.reason,
      },
    });

    const updatedCount = await this.propagateToFutureWorkouts(
      mesocycleId,
      dto.splitDayExerciseId,
      slot.exerciseId,
      dto.substituteExerciseId,
    );

    return { scope: 'REMAINING_BLOCK', override, updatedWorkoutExercises: updatedCount };
  }

  async applySubstitutionScope(
    userId: string,
    data: {
      workoutId: string;
      exerciseId: string;
      substituteExerciseId: string;
      scope: 'SESSION' | 'REMAINING_BLOCK';
      source?: 'MANUAL' | 'PAIN';
      reason?: string;
    },
  ) {
    const workout = await this.prisma.workout.findFirst({
      where: { id: data.workoutId, userId },
      select: { id: true, mesocycleId: true, status: true },
    });
    if (!workout) throw new NotFoundException('Workout not found');
    if (!workout.mesocycleId) {
      throw new BadRequestException('Workout is not part of a mesocycle');
    }

    const workoutExercise = await this.prisma.workoutExercise.findFirst({
      where: {
        workoutId: data.workoutId,
        exerciseId: data.exerciseId,
      },
    });
    if (!workoutExercise?.sourceExerciseId) {
      await this.prisma.workoutExercise.updateMany({
        where: {
          workoutId: data.workoutId,
          exerciseId: data.exerciseId,
        },
        data: { exerciseId: data.substituteExerciseId },
      });
      return { scope: data.scope, applied: true };
    }

    if (data.scope === 'SESSION') {
      await this.applySessionSwap(
        workout.mesocycleId,
        data.workoutId,
        workoutExercise.sourceExerciseId,
        data.exerciseId,
        data.substituteExerciseId,
      );
      return { scope: 'SESSION', applied: true };
    }

    return this.createOverride(userId, workout.mesocycleId, {
      splitDayExerciseId: workoutExercise.sourceExerciseId,
      substituteExerciseId: data.substituteExerciseId,
      workoutId: data.workoutId,
      scope: 'REMAINING_BLOCK',
      source: data.source ?? 'PAIN',
      reason: data.reason,
    });
  }

  private async applySessionSwap(
    mesocycleId: string,
    workoutId: string,
    splitDayExerciseId: string,
    originalExerciseId: string,
    substituteExerciseId: string,
  ) {
    const workout = await this.prisma.workout.findFirst({
      where: { id: workoutId, mesocycleId, status: { in: ['PLANNED', 'IN_PROGRESS'] } },
    });
    if (!workout) {
      throw new BadRequestException('Cannot swap exercises on a completed workout');
    }

    await this.prisma.workoutExercise.updateMany({
      where: {
        workoutId,
        OR: [
          { sourceExerciseId: splitDayExerciseId },
          { exerciseId: originalExerciseId },
        ],
      },
      data: { exerciseId: substituteExerciseId },
    });

    await this.patchPrescriptionSnapshot(workoutId, originalExerciseId, substituteExerciseId);
  }

  private async propagateToFutureWorkouts(
    mesocycleId: string,
    splitDayExerciseId: string,
    originalExerciseId: string,
    substituteExerciseId: string,
  ) {
    const substitute = await this.prisma.exercise.findUnique({
      where: { id: substituteExerciseId },
      select: { name: true },
    });

    const futureExercises = await this.prisma.workoutExercise.findMany({
      where: {
        sourceExerciseId: splitDayExerciseId,
        workout: {
          mesocycleId,
          status: { in: ['PLANNED', 'IN_PROGRESS'] },
        },
      },
      select: { id: true, workoutId: true },
    });

    if (futureExercises.length === 0) return 0;

    await this.prisma.workoutExercise.updateMany({
      where: { id: { in: futureExercises.map((row) => row.id) } },
      data: { exerciseId: substituteExerciseId },
    });

    const workoutIds = [...new Set(futureExercises.map((row) => row.workoutId))];
    for (const workoutId of workoutIds) {
      await this.patchPrescriptionSnapshot(
        workoutId,
        originalExerciseId,
        substituteExerciseId,
        substitute?.name,
      );
    }

    return futureExercises.length;
  }

  private async patchPrescriptionSnapshot(
    workoutId: string,
    originalExerciseId: string,
    substituteExerciseId: string,
    substituteName?: string | null,
  ) {
    const workout = await this.prisma.workout.findUnique({
      where: { id: workoutId },
      select: { prescriptionSnapshot: true },
    });
    if (!workout?.prescriptionSnapshot) return;

    const snapshot = workout.prescriptionSnapshot as PrescriptionSnapshot;
    if (!Array.isArray(snapshot.exercises)) return;

    const substitute =
      substituteName ??
      (
        await this.prisma.exercise.findUnique({
          where: { id: substituteExerciseId },
          select: { name: true },
        })
      )?.name;

    const exercises = snapshot.exercises.map((entry) =>
      entry.exerciseId === originalExerciseId
        ? {
            ...entry,
            exerciseId: substituteExerciseId,
            exerciseName: substitute ?? entry.exerciseName,
          }
        : entry,
    );

    await this.prisma.workout.update({
      where: { id: workoutId },
      data: {
        prescriptionSnapshot: {
          ...snapshot,
          exercises,
        } as Prisma.InputJsonValue,
      },
    });
  }

  private async assertMesocycleOwner(userId: string, mesocycleId: string) {
    const meso = await this.prisma.mesocycle.findFirst({
      where: { id: mesocycleId, userId },
      select: { id: true },
    });
    if (!meso) throw new NotFoundException(`Mesocycle ${mesocycleId} not found`);
  }
}
