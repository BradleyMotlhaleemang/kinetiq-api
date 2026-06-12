import { Injectable } from '@nestjs/common';
import { PRRecord, PRScope, PRType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PrDetectionService {
  constructor(private readonly prisma: PrismaService) {}

  private getMonthYear(date: Date): string {
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    return `${date.getFullYear()}-${month}`;
  }

  private recordKey(
    exerciseId: string,
    scope: PRScope,
    type: PRType,
    mesocycleId: string | null,
    monthYear: string | null,
  ): string {
    return `${exerciseId}:${scope}:${type}:${mesocycleId ?? ''}:${monthYear ?? ''}`;
  }

  private buildRecordMap(records: PRRecord[]): Map<string, PRRecord> {
    const map = new Map<string, PRRecord>();
    for (const rec of records) {
      const key = this.recordKey(
        rec.exerciseId,
        rec.scope,
        rec.type,
        rec.mesocycleId,
        rec.monthYear,
      );
      const existing = map.get(key);
      if (!existing || rec.value > existing.value) {
        map.set(key, rec);
      }
    }
    return map;
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

    if (sets.length === 0) return;

    const exerciseIds = [...new Set(sets.map((s) => s.exerciseId))];
    const monthYear = this.getMonthYear(new Date());
    const achievedAt = new Date();

    const existingRecords = await this.prisma.pRRecord.findMany({
      where: {
        userId,
        exerciseId: { in: exerciseIds },
        OR: [
          { scope: PRScope.ALL_TIME },
          ...(workout?.mesocycleId
            ? [{ scope: PRScope.MESOCYCLE, mesocycleId: workout.mesocycleId }]
            : []),
          { scope: PRScope.MONTHLY, monthYear },
        ],
      },
    });

    const recordMap = this.buildRecordMap(existingRecords);

    for (const set of sets) {
      const e1rm = set.e1rm ?? 0;
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
          monthYear: string | null;
          mesocycleId: string | null;
        }> = [
          { scope: PRScope.ALL_TIME, monthYear: null, mesocycleId: null },
          ...(workout?.mesocycleId
            ? [{ scope: PRScope.MESOCYCLE, monthYear: null, mesocycleId: workout.mesocycleId }]
            : []),
          { scope: PRScope.MONTHLY, monthYear, mesocycleId: null },
        ];

        for (const check of checks) {
          const key = this.recordKey(
            set.exerciseId,
            check.scope,
            candidate.type,
            check.mesocycleId,
            check.monthYear,
          );
          const existing = recordMap.get(key);

          if (existing && candidate.value <= existing.value) continue;

          if (existing) {
            const updated = await this.prisma.pRRecord.update({
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
            recordMap.set(key, updated);
          } else {
            const created = await this.prisma.pRRecord.create({
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
            recordMap.set(key, created);
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
