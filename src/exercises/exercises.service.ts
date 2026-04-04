import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ExercisesService {
  constructor(private prisma: PrismaService) {}

  findAll(filters?: { primaryMuscle?: string; movementPattern?: string }) {
    return this.prisma.exercise.findMany({
      where: {
        ...(filters?.primaryMuscle && { primaryMuscle: filters.primaryMuscle }),
        ...(filters?.movementPattern && { movementPattern: filters.movementPattern }),
      },
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