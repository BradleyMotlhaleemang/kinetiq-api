import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { JOINT_TRIAGE_OUTCOMES } from '../joint-pain-scale';

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

  @IsOptional()
  @IsIn([...JOINT_TRIAGE_OUTCOMES])
  jointTriage?: (typeof JOINT_TRIAGE_OUTCOMES)[number];

  @IsObject()
  sorenessLog!: Record<string, number>;

  @IsObject()
  jointComfortLog!: Record<string, unknown>;

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
