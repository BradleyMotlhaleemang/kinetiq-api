import {
  IsArray,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import {
  ChestRegion,
  ExerciseCategory,
  ExerciseType,
  MovementClass,
  MovementPattern,
  MuscleGroup,
} from '@prisma/client';

export class UpdateAdminExerciseDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(MuscleGroup)
  primaryMuscle?: MuscleGroup;

  @IsOptional()
  @IsArray()
  @IsEnum(MuscleGroup, { each: true })
  secondaryMuscles?: MuscleGroup[];

  @IsOptional()
  @IsEnum(MovementPattern)
  movementPattern?: MovementPattern;

  @IsOptional()
  @IsEnum(ExerciseType)
  exerciseType?: ExerciseType;

  @IsOptional()
  @IsEnum(MovementClass)
  movementClass?: MovementClass;

  @IsOptional()
  @IsEnum(ExerciseCategory)
  category?: ExerciseCategory;

  @IsOptional()
  @IsEnum(ChestRegion)
  chestRegion?: ChestRegion | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(90)
  inclineAngleDegrees?: number | null;

  @IsOptional()
  @IsString()
  equipmentProfileId?: string;

  @IsOptional()
  @IsString()
  executionProfileId?: string;

  @IsOptional()
  @IsNumber()
  fatigueScore?: number;

  @IsOptional()
  @IsNumber()
  stabilityDemand?: number;

  @IsOptional()
  @IsNumber()
  methodFatigueMultiplier?: number;
}
