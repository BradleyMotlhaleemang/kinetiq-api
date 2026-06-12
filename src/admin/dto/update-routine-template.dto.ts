import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { ExperienceLevel, TrainingGoal } from '@prisma/client';

export class UpdateRoutineTemplateDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  daysPerWeek?: number;

  @IsOptional()
  @IsString()
  splitType?: string;

  @IsOptional()
  @IsEnum(ExperienceLevel)
  level?: ExperienceLevel;

  @IsOptional()
  @IsEnum(TrainingGoal)
  goal?: TrainingGoal;

  @IsOptional()
  @IsString({ each: true })
  goalTags?: string[];

  @IsOptional()
  @IsString({ each: true })
  experienceTags?: string[];
}
