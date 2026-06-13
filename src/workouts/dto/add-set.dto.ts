import { IsInt, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class AddSetDto {
  @IsString()
  exerciseId: string;

  @IsInt()
  @Min(1)
  setNumber: number;

  @IsNumber()
  @Min(0)
  @Max(500)
  weight: number;

  @IsInt()
  @Min(1)
  @Max(100)
  reps: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  rpe?: number;
}
