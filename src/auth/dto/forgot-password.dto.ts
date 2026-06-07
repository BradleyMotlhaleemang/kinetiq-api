import { IsEmail } from 'class-validator';

export class ForgotPasswordDto {
  @IsEmail({}, { message: 'INVALID_EMAIL_FORMAT' })
  email: string;
}
