import { Injectable } from '@nestjs/common';
import { PRScope, PRType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PrDetectionService {
  constructor(private readonly prisma: PrismaService) {}

  private getMonthYear(date: Date): string {
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    return `${date.getFullYear()}-${month}`;
  }

  async detectPRs(userId: string, workoutId: string) {
    const workout = await this.prisma.workout.findUnique({
      where: { id: workoutId },
      select: { mesocycleId: true },
    });

    const sets = await this.prisma.set.findMany({
      where: { workoutId },
      include: {
        exercise: {
          include: {
            metadata: { include: { equipmentProfile: true } },
          },
        },
      },
    });

    for (const set of sets) {
      const e1rm = set.e1rm ?? 0;
      const monthYear = this.getMonthYear(new Date());
      const achievedAt = new Date();
      const equipmentName = set.exercise.metadata?.equipmentProfile?.name ?? null;

      const candidates: Array<{ type: PRType; value: number }> = [
        { type: PRType.E1RM, value: e1rm },
        { type: PRType.WEIGHT, value: set.weight },
        { type: PRType.VOLUME, value: set.weight * set.reps },
      ];

      const hitTypes = new Set<PRType>();

      for (const candidate of candidates) {
        const checks: Array<{
          scope: PRScope;
          where: Record<string, unknown>;
          monthYear: string | null;
          mesocycleId: string | null;
        }> = [
          {
            scope: PRScope.ALL_TIME,
            where: {
              userId,
              exerciseId: set.exerciseId,
              scope: PRScope.ALL_TIME,
              type: candidate.type,
            },
            monthYear: null,
            mesocycleId: null,
          },
          ...(workout?.mesocycleId
            ? [
                {
                  scope: PRScope.MESOCYCLE,
                  where: {
                    userId,
                    exerciseId: set.exerciseId,
                    scope: PRScope.MESOCYCLE,
                    type: candidate.type,
                    mesocycleId: workout.mesocycleId,
                  },
                  monthYear: null,
                  mesocycleId: workout.mesocycleId,
                },
              ]
            : []),
          {
            scope: PRScope.MONTHLY,
            where: {
              userId,
              exerciseId: set.exerciseId,
              scope: PRScope.MONTHLY,
              type: candidate.type,
              monthYear,
            },
            monthYear,
            mesocycleId: null,
          },
        ];

        for (const check of checks) {
          const existing = await this.prisma.pRRecord.findFirst({
            where: check.where,
            orderBy: { value: 'desc' },
          });

          if (existing && candidate.value <= existing.value) continue;

          if (existing) {
            await this.prisma.pRRecord.update({
              where: { id: existing.id },
              data: {
                value: candidate.value,
                weight: set.weight,
                reps: set.reps,
                e1rm,
                setId: set.id,
                workoutId,
                equipmentName,
                achievedAt,
              },
            });
          } else {
            await this.prisma.pRRecord.create({
              data: {
                userId,
                exerciseId: set.exerciseId,
                workoutId,
                setId: set.id,
                mesocycleId: check.mesocycleId,
                monthYear: check.monthYear,
                scope: check.scope,
                type: candidate.type,
                equipmentName,
                value: candidate.value,
                weight: set.weight,
                reps: set.reps,
                e1rm,
                achievedAt,
              },
            });
          }

          hitTypes.add(candidate.type);
        }
      }

      if (hitTypes.size > 0) {
        const prType = hitTypes.has(PRType.E1RM)
          ? PRType.E1RM
          : Array.from(hitTypes)[0];
        await this.prisma.set.update({
          where: { id: set.id },
          data: { isPR: true, prType },
        });
      }
    }
  }
}
