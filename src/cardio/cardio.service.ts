import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const MET_VALUES: Record<string, number> = {
  TREADMILL: 8.0,
  RUNNING: 9.8,
  CYCLING: 7.5,
  ROWING: 7.0,
  WALKING: 3.5,
  ELLIPTICAL: 5.0,
  HIIT: 10.0,
  CUSTOM: 6.0,
};

const ZONE_MULTIPLIERS: Record<string, number> = {
  LOW_INTENSITY: 0.6,
  MODERATE: 0.8,
  HIGH_INTENSITY: 1.0,
  HIIT: 1.3,
};

const CARDIO_CALIBRATION = 0.70;

@Injectable()
export class CardioService {
  constructor(private prisma: PrismaService) {}

  async logSession(
    userId: string,
    data: {
      type: string;
      durationMinutes: number;
      distanceKm?: number;
      avgHeartRate?: number;
      peakHeartRate?: number;
      perceivedEffort: number;
    },
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const bodyweightKg = user?.bodyweightKg ?? 75;

    const met = MET_VALUES[data.type] ?? 6.0;
    const cardioZone = this.deriveZone(data.perceivedEffort, data.avgHeartRate);
    const zoneMultiplier = ZONE_MULTIPLIERS[cardioZone] ?? 0.8;

    const caloriesEstimated =
      met * (data.durationMinutes / 60) * bodyweightKg;

    const sflContribution =
      met *
      (data.durationMinutes / 60) *
      bodyweightKg *
      zoneMultiplier *
      CARDIO_CALIBRATION;

    return this.prisma.cardioSession.create({
      data: {
        userId,
        type: data.type,
        durationMinutes: data.durationMinutes,
        distanceKm: data.distanceKm ?? null,
        avgHeartRate: data.avgHeartRate ?? null,
        peakHeartRate: data.peakHeartRate ?? null,
        caloriesEstimated,
        cardioZone,
        perceivedEffort: data.perceivedEffort,
        sflContribution,
      },
    });
  }

  async getHistory(userId: string) {
    return this.prisma.cardioSession.findMany({
      where: { userId },
      orderBy: { loggedAt: 'desc' },
      take: 20,
    });
  }

  private deriveZone(perceivedEffort: number, avgHeartRate?: number): string {
    if (avgHeartRate) {
      if (avgHeartRate < 120) return 'LOW_INTENSITY';
      if (avgHeartRate < 150) return 'MODERATE';
      if (avgHeartRate < 170) return 'HIGH_INTENSITY';
      return 'HIIT';
    }
    if (perceivedEffort <= 3) return 'LOW_INTENSITY';
    if (perceivedEffort <= 5) return 'MODERATE';
    if (perceivedEffort <= 7) return 'HIGH_INTENSITY';
    return 'HIIT';
  }
}