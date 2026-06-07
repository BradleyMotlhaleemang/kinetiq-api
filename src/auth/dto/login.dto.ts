import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'INVALID_EMAIL_FORMAT' })
  email: string;

  @IsString()
  @MinLength(1)
  password: string;
}
