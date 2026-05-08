import { Injectable } from '@nestjs/common';
import type { ExerciseCategory } from '@prisma/client';

export type VolumeProgressionInput = {
  userId: string;
  exerciseId: string;
  exerciseCategory: ExerciseCategory;
  currentSetCount: number;
  templateSetCount: number;
  weekNumber: number;
  mrvSetCount: number;
  recentVolumeSignals: (number | null)[];
  recentPumpScores: (number | null)[];
  recentSorenessScores: number[];
  sorenessThreshold: number;
};

@Injectable()
export class VolumeProgressionService {
  async evaluateSetTarget(
    input: VolumeProgressionInput,
  ): Promise<{ setTarget: number; reason: string }> {
    if (input.currentSetCount >= input.mrvSetCount) {
      return {
        setTarget: input.currentSetCount,
        reason: 'At MRV ceiling — holding sets',
      };
    }

    const sorenessHits = input.recentSorenessScores.filter(
      (s) => s >= input.sorenessThreshold,
    ).length;
    if (sorenessHits >= 2) {
      return {
        setTarget: input.currentSetCount,
        reason: 'Persistent soreness — holding sets',
      };
    }

    const mostRecentVolume = input.recentVolumeSignals[0];
    if (mostRecentVolume === 1) {
      return {
        setTarget: input.currentSetCount,
        reason: 'Volume feel: too much — holding sets',
      };
    }

    const strongPumpSessions = input.recentPumpScores.filter(
      (p) => p !== null && p !== undefined && p >= 3,
    ).length;
    if (
      strongPumpSessions >= 2 &&
      (mostRecentVolume === 0 || mostRecentVolume === -1)
    ) {
      return {
        setTarget: Math.min(input.currentSetCount + 1, input.mrvSetCount),
        reason: 'Volume and pump signals support set increase',
      };
    }

    return {
      setTarget: input.currentSetCount,
      reason: 'Insufficient signal to increase volume',
    };
  }
}
