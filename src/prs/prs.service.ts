import { Injectable } from '@nestjs/common';
import { PRRecord } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PrsService {
  constructor(private prisma: PrismaService) {}

  getByExercise(userId: string, exerciseId: string): Promise<PRRecord[]> {
    return this.prisma.pRRecord.findMany({
      where: { userId, exerciseId },
      orderBy: { achievedAt: 'desc' },
    });
  }

  getRecent(userId: string, limit = 5): Promise<PRRecord[]> {
    return this.prisma.pRRecord.findMany({
      where: { userId },
      orderBy: { achievedAt: 'desc' },
      take: limit,
      include: { exercise: { select: { name: true } } },
    });
  }

  getByMesocycle(userId: string, mesocycleId: string): Promise<PRRecord[]> {
    return this.prisma.pRRecord.findMany({
      where: { userId, mesocycleId },
      orderBy: { achievedAt: 'desc' },
      include: { exercise: { select: { name: true } } },
    });
  }
}
