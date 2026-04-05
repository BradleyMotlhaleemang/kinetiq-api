import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TimerService {
  constructor(private prisma: PrismaService) {}

  async getPreference(userId: string, exerciseId?: string) {
    if (exerciseId) {
      const specific = await this.prisma.restPreference.findUnique({
        where: { userId_exerciseId: { userId, exerciseId } },
      });
      if (specific) return specific;
    }

    return this.prisma.restPreference.findFirst({
      where: { userId, exerciseId: null },
    });
  }

 async upsertPreference(
  userId: string,
  restSeconds: number,
  exerciseId?: string,
) {
  if (exerciseId) {
    return this.prisma.restPreference.upsert({
      where: {
        userId_exerciseId: { userId, exerciseId },
      },
      update: { restSeconds },
      create: { userId, exerciseId, restSeconds },
    });
  }

  const existing = await this.prisma.restPreference.findFirst({
    where: { userId, exerciseId: null },
  });

  if (existing) {
    return this.prisma.restPreference.update({
      where: { id: existing.id },
      data: { restSeconds },
    });
  }

  return this.prisma.restPreference.create({
    data: { userId, restSeconds },
  });
}

  async logRest(
    userId: string,
    workoutId: string,
    setId: string,
    actualRestSeconds: number,
    previousSetId?: string,
  ) {
    return this.prisma.setRestLog.create({
      data: {
        userId,
        workoutId,
        setId,
        previousSetId: previousSetId ?? null,
        actualRestSeconds,
      },
    });
  }

  async getRestHistory(userId: string, workoutId: string) {
    return this.prisma.setRestLog.findMany({
      where: { userId, workoutId },
      orderBy: { loggedAt: 'asc' },
    });
  }
}
