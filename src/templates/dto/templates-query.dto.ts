import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class TemplatesQueryDto {
  @IsOptional()
  @IsString()
  goal?: string;

  @IsOptional()
  @IsString()
  level?: string;

  @IsOptional()
  @IsString()
  splitStyle?: string;

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
  search?: string;
}
