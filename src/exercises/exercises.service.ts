import { Injectable } from '@nestjs/common';
import { MovementPattern, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RedisCacheService } from '../common/redis/redis-cache.service';
import { stableQueryHash } from '../common/utils/cache-key.util';

const CATALOG_TTL_SECONDS = 6 * 60 * 60;

@Injectable()
export class ExercisesService {
  constructor(
    private prisma: PrismaService,
    private cache: RedisCacheService,
  ) {}

  private resolveMovementPatternFilter(
    pattern: string,
  ): Prisma.ExerciseWhereInput['movementPattern'] {
    const upper = pattern.toUpperCase();
    const aliases: Record<string, MovementPattern[]> = {
      PUSH: [MovementPattern.HORIZONTAL_PUSH, MovementPattern.VERTICAL_PUSH],
      PULL: [MovementPattern.HORIZONTAL_PULL, MovementPattern.VERTICAL_PULL],
      CORE: [MovementPattern.ISOLATION],
    };
    if (aliases[upper]) {
      return { in: aliases[upper] };
    }
    return upper as MovementPattern;
  }

  async invalidateCatalogCache(): Promise<void> {
    await this.cache.delPattern('catalog:exercises:*');
    await this.cache.delPattern('catalog:exercise:*');
  }

  findAll(filters?: { primaryMuscle?: string; movementPattern?: string }) {
    const cacheKey = `catalog:exercises:${stableQueryHash(filters ?? {})}`;
    return this.cache.getOrSet(cacheKey, CATALOG_TTL_SECONDS, () => {
      const where: Prisma.ExerciseWhereInput = {
        ...(filters?.primaryMuscle && {
          primaryMuscle: filters.primaryMuscle as Prisma.ExerciseWhereInput['primaryMuscle'],
        }),
        ...(filters?.movementPattern && {
          movementPattern: this.resolveMovementPatternFilter(filters.movementPattern),
        }),
      };

      return this.prisma.exercise.findMany({
        where,
        include: { metadata: true },
      });
    });
  }

  findOne(id: string) {
    const cacheKey = `catalog:exercise:${id}`;
    return this.cache.getOrSet(cacheKey, CATALOG_TTL_SECONDS, () =>
      this.prisma.exercise.findUnique({
        where: { id },
        include: {
          metadata: { include: { equipmentProfile: true, executionProfile: true } },
          substitutionPools: { include: { pool: true }, orderBy: { priority: 'asc' } },
        },
      }),
    );
  }

  findSubstitutions(id: string, jointId?: string) {
    const cacheKey = `catalog:exercise:${id}:subs:${jointId ?? 'all'}`;
    return this.cache.getOrSet(cacheKey, CATALOG_TTL_SECONDS, () =>
      this.prisma.substitutionPoolExercise.findMany({
        where: {
          pool: { exercises: { some: { exerciseId: id } } },
          NOT: { exerciseId: id },
          ...(jointId && { suitableWhenPain: { has: jointId } }),
        },
        include: { exercise: true },
        orderBy: { priority: 'asc' },
      }),
    );
  }
}
