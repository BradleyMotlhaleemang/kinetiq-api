import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  Max,
  Min,
} from 'class-validator';

export const EXPERIENCE_LEVEL_VALUES = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] as const;

export type ExperienceLevelValue = (typeof EXPERIENCE_LEVEL_VALUES)[number];

export class SubmitClassificationDto {
  @IsArray()
  @ArrayMinSize(12)
  @ArrayMaxSize(12)
  @Type(() => Number)
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(3, { each: true })
  answers!: number[];

  @IsOptional()
  @IsIn(EXPERIENCE_LEVEL_VALUES)
  selectedLevel?: ExperienceLevelValue;

  @IsOptional()
  @IsBoolean()
  levelOverrideAcknowledged?: boolean;
}
