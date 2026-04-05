import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WorkoutsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, mesocycleId?: string, splitDayLabel?: string) {
    return this.prisma.workout.create({
      data: {
        userId,
        mesocycleId: mesocycleId ?? null,
        splitDayLabel: splitDayLabel ?? null,
        status: 'IN_PROGRESS',
      },
    });
  }

  async findOne(userId: string, id: string) {
    const workout = await this.prisma.workout.findFirst({
      where: { id, userId },
      include: { sets: true },
    });
    if (!workout) throw new NotFoundException('Workout not found');
    return workout;
  }

  async findHistory(userId: string) {
    return this.prisma.workout.findMany({
      where: { userId, status: 'COMPLETED' },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: { sets: true },
    });
  }

  async addSet(
    userId: string,
    workoutId: string,
    exerciseId: string,
    setNumber: number,
    weight: number,
    reps: number,
    rpe?: number,
  ) {
    await this.findOne(userId, workoutId);

    const e1rm = weight * (1 + reps / 30);
    const effectiveReps = rpe && rpe >= 7 ? reps * ((rpe - 6) / 4) : reps * 0.5;
    const fatigueCost = weight * 0.01 * (rpe ? rpe / 10 : 0.7);
    const stimulusScore = effectiveReps * (e1rm / 100);

    return this.prisma.set.create({
      data: {
        workoutId,
        exerciseId,
        setNumber,
        weight,
        reps,
        rpe: rpe ?? null,
        e1rm,
        effectiveReps,
        fatigueCost,
        stimulusScore,
      },
    });
  }

  async updateSet(
    userId: string,
    workoutId: string,
    setId: string,
    weight: number,
    reps: number,
    rpe?: number,
  ) {
    await this.findOne(userId, workoutId);

    const e1rm = weight * (1 + reps / 30);
    const effectiveReps = rpe && rpe >= 7 ? reps * ((rpe - 6) / 4) : reps * 0.5;
    const fatigueCost = weight * 0.01 * (rpe ? rpe / 10 : 0.7);
    const stimulusScore = effectiveReps * (e1rm / 100);

    return this.prisma.set.update({
      where: { id: setId },
      data: { weight, reps, rpe: rpe ?? null, e1rm, effectiveReps, fatigueCost, stimulusScore },
    });
  }

  async complete(userId: string, workoutId: string) {
    const workout = await this.findOne(userId, workoutId);

    const totalVolume = workout.sets.reduce(
      (sum, s) => sum + s.weight * s.reps, 0,
    );
    const totalSets = workout.sets.length;

    return this.prisma.workout.update({
      where: { id: workoutId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        totalVolume,
        totalSets,
      },
    });
  }
}