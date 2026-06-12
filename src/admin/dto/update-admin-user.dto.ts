import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { AccountStatus } from '@prisma/client';

export class UpdateAdminUserDto {
  @IsOptional()
  @IsEnum(AccountStatus)
  accountStatus?: AccountStatus;

  @IsOptional()
  @IsBoolean()
  forceVerifyEmail?: boolean;

  @IsOptional()
  @IsBoolean()
  unlock?: boolean;
}
