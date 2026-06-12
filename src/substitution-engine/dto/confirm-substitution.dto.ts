import { IsIn, IsNumber, IsOptional, IsString } from 'class-validator';

export class ConfirmSubstitutionDto {
  @IsString()
  workoutId!: string;

  @IsString()
  exerciseId!: string;

  @IsString()
  substituteExerciseId!: string;

  @IsString()
  jointAffected!: string;

  @IsOptional()
  @IsNumber()
  painScoreAtSwap?: number;

  @IsOptional()
  @IsIn(['SESSION', 'REMAINING_BLOCK'])
  scope?: 'SESSION' | 'REMAINING_BLOCK';
}
