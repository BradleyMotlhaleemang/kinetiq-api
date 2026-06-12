import { IsArray, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateSubstitutionPoolDto {
  @IsString()
  name!: string;

  @IsString()
  primaryMuscle!: string;

  @IsString()
  movementPattern!: string;
}

export class UpdateSubstitutionPoolDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  primaryMuscle?: string;

  @IsOptional()
  @IsString()
  movementPattern?: string;
}

export class UpsertPoolExerciseDto {
  @IsString()
  exerciseId!: string;

  @IsInt()
  @Min(1)
  priority!: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  suitableWhenPain?: string[];
}
