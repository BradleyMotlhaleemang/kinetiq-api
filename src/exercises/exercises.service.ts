import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ExercisesService {
  constructor(private prisma: PrismaService) {}

  findAll(filters?: { primaryMuscle?: string; movementPattern?: string }) {
    const where: Prisma.ExerciseWhereInput = {
      ...(filters?.primaryMuscle && {
        primaryMuscle: filters.primaryMuscle as any,
      }),
      ...(filters?.movementPattern && {
        movementPattern: filters.movementPattern as any,
      }),
    };

    return this.prisma.exercise.findMany({
      where,
      include: { metadata: true },
    });
  }

  findOne(id: string) {
    return this.prisma.exercise.findUnique({
      where: { id },
      include: {
        metadata: { include: { equipmentProfile: true, executionProfile: true } },
        substitutionPools: { include: { pool: true }, orderBy: { priority: 'asc' } },
      },
    });
  }

  findSubstitutions(id: string, jointId?: string) {
    return this.prisma.substitutionPoolExercise.findMany({
      where: {
        pool: { exercises: { some: { exerciseId: id } } },
        NOT: { exerciseId: id },
        ...(jointId && { suitableWhenPain: { has: jointId } }),
      },
      include: { exercise: true },
      orderBy: { priority: 'asc' },
    });
  }
}