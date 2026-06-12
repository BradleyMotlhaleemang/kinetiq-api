import { Injectable } from '@nestjs/common';
import type { ExerciseCategory } from '@prisma/client';
import {
  JOINT_PAIN_MONITOR_MIN,
  JOINT_PAIN_SEVERE_MIN,
} from '../../biofeedback/joint-pain-scale';

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
  /** Max joint pain for this exercise from recent biofeedback (internal 0–9). */
  jointPainScore?: number;
};

@Injectable()
export class VolumeProgressionService {
  async evaluateSetTarget(
    input: VolumeProgressionInput,
  ): Promise<{ setTarget: number; reason: string }> {
    const floor = Math.max(input.templateSetCount, 1);
    const jointPain = input.jointPainScore ?? 0;

    if (jointPain >= JOINT_PAIN_SEVERE_MIN) {
      return {
        setTarget: this.clampSetTarget(input.currentSetCount, floor),
        reason: 'Joint pain elevated — holding sets',
      };
    }

    if (jointPain >= JOINT_PAIN_MONITOR_MIN) {
      return {
        setTarget: this.clampSetTarget(input.currentSetCount, floor),
        reason: 'Joint discomfort — monitoring volume',
      };
    }

    if (input.currentSetCount >= input.mrvSetCount) {
      return {
        setTarget: this.clampSetTarget(input.currentSetCount, floor),
        reason: 'At MRV ceiling — holding sets',
      };
    }

    const sorenessHits = input.recentSorenessScores.filter(
      (s) => s >= input.sorenessThreshold,
    ).length;
    if (sorenessHits >= 2) {
      return {
        setTarget: this.clampSetTarget(input.currentSetCount, floor),
        reason: 'Persistent soreness — holding sets',
      };
    }

    const mostRecentVolume = input.recentVolumeSignals[0];
    if (mostRecentVolume === 1) {
      return {
        setTarget: this.clampSetTarget(input.currentSetCount, floor),
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
        setTarget: Math.min(
          Math.max(input.currentSetCount + 1, floor),
          input.mrvSetCount,
        ),
        reason: 'Volume and pump signals support set increase',
      };
    }

    return {
      setTarget: this.clampSetTarget(input.currentSetCount, floor),
      reason: 'Insufficient signal to increase volume',
    };
  }

  /** Never return 0 sets — template count is the floor for UI scaffolding. */
  private clampSetTarget(setTarget: number, floor: number): number {
    return Math.max(setTarget, floor);
  }
}
