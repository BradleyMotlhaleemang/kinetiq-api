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
  jointPain!: string;

  @IsString()
  soreness!: string;

  @IsString()
  pump!: string;

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
  jointPainLog!: Record<string, number>;

  @IsInt()
  energyLevel!: number;

  @IsInt()
  strengthRating!: number;

  @IsInt()
  muscleFeel!: number;

  @IsInt()
  sleepLastNight!: number;

  @IsInt()
  overallWellbeing!: number;

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
