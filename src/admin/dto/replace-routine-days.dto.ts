import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

class RoutineDayExerciseDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  exerciseId!: string;

  @IsInt()
  @Min(0)
  orderIndex!: number;

  @IsInt()
  @Min(1)
  setsTarget!: number;

  @IsInt()
  @Min(1)
  repRangeMin!: number;

  @IsInt()
  @Min(1)
  repRangeMax!: number;

  @IsOptional()
  @IsNumber()
  rpeTarget?: number;
}

class RoutineDayDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsInt()
  @Min(1)
  dayNumber!: number;

  @IsEnum(['WORKOUT', 'REST'])
  dayType!: 'WORKOUT' | 'REST';

  @IsString()
  label!: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RoutineDayExerciseDto)
  exercises?: RoutineDayExerciseDto[];
}

export class ReplaceRoutineDaysDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RoutineDayDto)
  days!: RoutineDayDto[];
}
