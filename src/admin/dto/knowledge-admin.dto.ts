import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateKnowledgeDto {
  @IsString()
  slug!: string;

  @IsString()
  category!: string;

  @IsString()
  title!: string;

  @IsString()
  summary!: string;

  @IsString()
  body!: string;

  @IsOptional()
  @IsString()
  targetAudience?: string;
}

export class UpdateKnowledgeDto {
  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  summary?: string;

  @IsOptional()
  @IsString()
  body?: string;

  @IsOptional()
  @IsString()
  targetAudience?: string;
}

export class UpdateAnnouncementDto {
  @IsString()
  message!: string;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}
