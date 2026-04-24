// src/templates/dto/templates-query.dto.ts
import { IsOptional, IsString, IsBoolean, IsInt, Min, Max } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class TemplatesQueryDto {
  @IsOptional()
  @IsString()
  goal?: string;           // 'HYPERTROPHY' | 'STRENGTH' | 'POWERBUILDING' | 'POWERLIFTING'

  @IsOptional()
  @IsString()
  level?: string;          // 'NOVICE' | 'INTERMEDIATE' | 'ADVANCED'

  @IsOptional()
  @IsString()
  splitStyle?: string;     // 'PPL' | 'UPPER_LOWER' | 'FULL_BODY' | 'BODY_PART' | 'HYBRID' | 'SPECIALIZED'

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(7)
  daysPerWeekMin?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(7)
  daysPerWeekMax?: number;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  featuredOnly?: boolean;

  @IsOptional()
  @IsString()
  search?: string;         // partial match on name
}