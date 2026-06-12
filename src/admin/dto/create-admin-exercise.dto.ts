import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import {
  ExerciseCategory,
  ExerciseType,
  MovementClass,
  MovementPattern,
  MuscleGroup,
} from '@prisma/client';

export class CreateAdminExerciseDto {
  @IsString()
  name!: string;

  @IsEnum(MuscleGroup)
  primaryMuscle!: MuscleGroup;

  @IsOptional()
  @IsArray()
  @IsEnum(MuscleGroup, { each: true })
  secondaryMuscles?: MuscleGroup[];

  @IsEnum(MovementPattern)
  movementPattern!: MovementPattern;

  @IsEnum(ExerciseType)
  exerciseType!: ExerciseType;

  @IsOptional()
  @IsEnum(MovementClass)
  movementClass?: MovementClass;

  @IsOptional()
  @IsEnum(ExerciseCategory)
  category?: ExerciseCategory;

  @IsString()
  equipmentProfileId!: string;

  @IsString()
  executionProfileId!: string;

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
