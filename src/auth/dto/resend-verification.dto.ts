import { IsEmail } from 'class-validator';

export class ResendVerificationDto {
  @IsEmail({}, { message: 'INVALID_EMAIL_FORMAT' })
  email: string;
}
