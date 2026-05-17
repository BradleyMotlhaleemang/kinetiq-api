import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class MuscleGroupFeedbackItemDto {
  @IsString()
  muscleGroup!: string;

  @IsString()
  jointComfort!: string;

  @IsString()
  soreness!: string;

  @IsString()
  volume!: string;
}

export class CreateBiofeedbackDto {
  @IsOptional()
  @IsString()
  workoutId?: string;

  @IsObject()
  sorenessLog!: Record<string, number>;

  @IsObject()
  jointComfortLog!: Record<string, number>;

  @IsInt()
  globalJointComfortScore!: number;

  @IsInt()
  trainingDrive!: number;

  @IsInt()
  sessionPerformance!: number;

  @IsInt()
  @Min(1)
  @Max(5)
  pumpScore!: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MuscleGroupFeedbackItemDto)
  muscleGroupFeedback?: MuscleGroupFeedbackItemDto[];

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  effortScore?: number;
}
