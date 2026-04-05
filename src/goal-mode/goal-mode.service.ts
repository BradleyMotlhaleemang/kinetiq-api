import { Injectable } from '@nestjs/common';

export interface GoalModeParams {
  incrementMultiplier: number;
  volumeBias: 'LOW' | 'MID' | 'MEV_FLOOR';
  restSeconds: number;
  repRangeMin: number;
  repRangeMax: number;
}

@Injectable()
export class GoalModeService {
  getParameters(goalMode: string | null): GoalModeParams {
    switch (goalMode) {
      case 'STRENGTH':
        return {
          incrementMultiplier: 1.2,
          volumeBias: 'LOW',
          restSeconds: 240,
          repRangeMin: 3,
          repRangeMax: 6,
        };
      case 'MAINTAIN':
        return {
          incrementMultiplier: 0.8,
          volumeBias: 'MEV_FLOOR',
          restSeconds: 90,
          repRangeMin: 8,
          repRangeMax: 15,
        };
      case 'WEIGHT_LOSS':
        return {
          incrementMultiplier: 0.8,
          volumeBias: 'MEV_FLOOR',
          restSeconds: 75,
          repRangeMin: 10,
          repRangeMax: 20,
        };
      case 'MUSCLE_GAIN':
      default:
        return {
          incrementMultiplier: 1.0,
          volumeBias: 'MID',
          restSeconds: 120,
          repRangeMin: 6,
          repRangeMax: 12,
        };
    }
  }

  getTemplateSuggestion(goalMode: string | null): string {
    switch (goalMode) {
      case 'STRENGTH':
        return 'Upper/Lower 4-day';
      case 'WEIGHT_LOSS':
        return 'PPL 3-day';
      case 'MUSCLE_GAIN':
      default:
        return 'PPL 3-day';
    }
  }
}