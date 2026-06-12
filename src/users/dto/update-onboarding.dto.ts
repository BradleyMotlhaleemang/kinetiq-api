import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

const GOAL_MODES = ['MUSCLE_GAIN', 'STRENGTH', 'WEIGHT_LOSS', 'MAINTAIN', 'SPORT_SPECIFIC'] as const;
const GENDERS = ['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'] as const;

export class UpdateOnboardingDto {
  @IsOptional()
  @IsIn(GOAL_MODES)
  goalMode?: string;

  @IsOptional()
  @IsIn(GENDERS)
  gender?: string;

  @IsOptional()
  @IsString()
  dateOfBirth?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(20)
  @Max(500)
  bodyweightKg?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(7)
  daysPerWeek?: number;

  @IsOptional()
  @IsBoolean()
  notificationsEnabled?: boolean;

  @IsOptional()
  @IsString()
  preferredTrainingTime?: string;
}
