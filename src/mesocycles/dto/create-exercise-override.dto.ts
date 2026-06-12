import { IsIn, IsOptional, IsString } from 'class-validator';

export class CreateExerciseOverrideDto {
  @IsString()
  splitDayExerciseId!: string;

  @IsString()
  substituteExerciseId!: string;

  @IsOptional()
  @IsString()
  workoutId?: string;

  @IsIn(['SESSION', 'REMAINING_BLOCK'])
  scope!: 'SESSION' | 'REMAINING_BLOCK';

  @IsOptional()
  @IsIn(['MANUAL', 'PAIN'])
  source?: 'MANUAL' | 'PAIN';

  @IsOptional()
  @IsString()
  reason?: string;
}
