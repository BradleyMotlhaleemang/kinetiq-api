import { Processor, Process } from '@nestjs/bull';
import type { Job } from 'bull';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export const SFR_QUEUE = 'sfr-calculation';

@Injectable()
@Processor(SFR_QUEUE)
export class SfrWorker {
  constructor(private prisma: PrismaService) {}

  @Process('calculate')
  async handleCalculate(job: Job<{ userId: string; mesocycleId: string }>) {
    const { userId, mesocycleId } = job.data;

    const mesocycle = await this.prisma.mesocycle.findUnique({
      where: { id: mesocycleId },
      include: { workouts: { include: { sets: true } } },
    });

    if (!mesocycle) return;

   const exerciseMap = new Map<string, any>();

    for (const workout of mesocycle.workouts) {
      for (const set of workout.sets) {
        const existing = exerciseMap.get(set.exerciseId) ?? {
          totalStimulus: 0,
          totalFatigue: 0,
          count: 0,
        };

        exerciseMap.set(set.exerciseId, {
          totalStimulus: existing.totalStimulus + (set.stimulusScore ?? 0),
          totalFatigue: existing.totalFatigue + (set.fatigueCost ?? 0),
          count: existing.count + 1,
        });
      }
    }

    for (const [exerciseId, data] of exerciseMap.entries()) {
      const stimulusAvg = data.totalStimulus / data.count;
      const fatigueAvg = data.totalFatigue / data.count;
      const sfrScore = fatigueAvg > 0 ? stimulusAvg / fatigueAvg : 0;

      await this.prisma.userExerciseSFR.upsert({
        where: { userId_exerciseId: { userId, exerciseId } },
        update: {
          sfrScore,
          stimulusAvg,
          fatigueAvg,
          sampleSize: data.count,
        },
        create: {
          userId,
          exerciseId,
          sfrScore,
          stimulusAvg,
          fatigueAvg,
          sampleSize: data.count,
        },
      });
    }
  }
}