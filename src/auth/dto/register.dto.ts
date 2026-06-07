import { IsEmail, IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'INVALID_EMAIL_FORMAT' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @MaxLength(128)
  @Matches(/^(?=.*[a-zA-Z])(?=.*[0-9])/, {
    message: 'Password must be at least 8 characters and include a letter and a number',
  })
  password: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  displayName: string;
}
