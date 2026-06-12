import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ExperienceLevel, TrainingGoal } from '@prisma/client';

export class UpdateMesocycleTemplateDto {
  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @IsString()
  progressionNotes?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(ExperienceLevel)
  level?: ExperienceLevel;

  @IsOptional()
  @IsEnum(TrainingGoal)
  goal?: TrainingGoal;

  @IsOptional()
  @IsInt()
  @Min(1)
  durationWeeksMin?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  durationWeeksMax?: number;

  @IsOptional()
  @IsString()
  progressionType?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  deloadWeek?: number | null;

  @IsOptional()
  @IsString()
  deloadNotes?: string | null;

  @IsOptional()
  @IsString()
  difficultyWarning?: string | null;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}
