import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { toVolumeKey } from '../common/volume-key.util';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getE1rmTrend(userId: string, exerciseId: string) {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return this.prisma.performanceHistory.findMany({
      where: {
        userId,
        exerciseId,
        date: { gte: sevenDaysAgo },
      },
      orderBy: { date: 'asc' },
      select: { date: true, bestE1rm: true, bestWeight: true, bestReps: true },
    });
  }

  async getWeeklyVolume(userId: string) {
    const activeMesocycle = await this.prisma.mesocycle.findFirst({
      where: { userId, status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
    });

    if (!activeMesocycle) return [];

    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7)); // Monday

    const history = await this.prisma.performanceHistory.findMany({
      where: { userId, date: { gte: weekStart } },
      orderBy: { date: 'desc' },
      include: { exercise: true },
    });

    const byMuscle: Record<string, number> = {};
    for (const h of history) {
      const muscle = toVolumeKey(h.exercise.primaryMuscle);
      byMuscle[muscle] = (byMuscle[muscle] ?? 0) + h.totalSets;
    }

    const volumeTargets = activeMesocycle.volumeTargets as any;

    return Object.entries(byMuscle).map(([muscle, sets]) => ({
      muscle,
      setsThisWeek: sets,
      mev: volumeTargets[muscle]?.mev ?? 0,
      mrv: volumeTargets[muscle]?.mrv ?? 0,
      status:
        sets < (volumeTargets[muscle]?.mev ?? 0)
          ? 'BELOW_MEV'
          : sets > (volumeTargets[muscle]?.mrv ?? 0)
          ? 'ABOVE_MRV'
          : 'OPTIMAL',
    }));
  }

  async getVolumeTrends(userId: string) {
    const sixWeeksAgo = new Date(Date.now() - 42 * 24 * 60 * 60 * 1000);
    const history = await this.prisma.performanceHistory.findMany({
      where: { userId, date: { gte: sixWeeksAgo } },
      orderBy: { date: 'asc' },
      include: { exercise: true },
    });

    const byWeek: Record<string, Record<string, number>> = {};
    for (const h of history) {
      const week = this.getWeekLabel(h.date);
      if (!byWeek[week]) byWeek[week] = {};
      const muscle = h.exercise.primaryMuscle;
      byWeek[week][muscle] = (byWeek[week][muscle] ?? 0) + h.totalSets;
    }

    return Object.entries(byWeek).map(([week, muscles]) => ({
      week,
      muscles,
    }));
  }

  async getStrengthTrends(userId: string) {
    // Find the exercises this user has actually logged, ranked by session count
    const topPerformance = await this.prisma.performanceHistory.findMany({
      where: { userId },
      distinct: ['exerciseId'],
      orderBy: { date: 'desc' },
      take: 5,
      include: { exercise: true },
    });

    const exerciseIds = topPerformance.map((p) => p.exerciseId);

    const [allHistory, exercises] = await Promise.all([
      this.prisma.performanceHistory.findMany({
        where: { userId, exerciseId: { in: exerciseIds } },
        orderBy: { date: 'asc' },
        select: { exerciseId: true, date: true, bestE1rm: true, bestWeight: true },
      }),
      this.prisma.exercise.findMany({
        where: { id: { in: exerciseIds } },
        select: { id: true, name: true },
      }),
    ]);

    const nameMap = new Map(exercises.map((e) => [e.id, e.name]));
    const historyByExercise = new Map<string, typeof allHistory>();
    for (const record of allHistory) {
      const bucket = historyByExercise.get(record.exerciseId) ?? [];
      bucket.push(record);
      historyByExercise.set(record.exerciseId, bucket);
    }

    return exerciseIds.map((id) => ({
      exercise: nameMap.get(id) ?? id,
      history: (historyByExercise.get(id) ?? []).slice(-12),
    }));
  }

  async getInsights(userId: string) {
    const plateaus = await this.prisma.plateauMarker.findMany({
      where: { userId, resolved: false },
      include: { exercise: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    const progressionLogs = await this.prisma.progressionLog.findMany({
      where: { userId },
      orderBy: { loggedAt: 'desc' },
      take: 10,
      include: { exercise: true },
    });

    return { plateaus, progressionLogs };
  }

  async getSFRScore(userId: string, exerciseId: string) {
    return this.prisma.userExerciseSFR.findUnique({
      where: { userId_exerciseId: { userId, exerciseId } },
    });
  }

  private getWeekLabel(date: Date): string {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - d.getDay());
    return d.toISOString().split('T')[0];
  }
}