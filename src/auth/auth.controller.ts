import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  register(
    @Body() body: { email: string; password: string; displayName: string },
  ) {
    return this.auth.register(body.email, body.password, body.displayName);
  }

  @Post('login')
  login(@Body() body: { email: string; password: string }) {
    return this.auth.login(body.email, body.password);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  me(@Request() req: any) {
    return req.user;
  }

@Post('forgot-password')
async forgotPassword(@Body() body: { email: string }) {
  await this.auth.forgotPassword(body.email);
  return { message: 'If that email is registered, you will receive a reset link shortly.' };
}

@Post('reset-password')
async resetPassword(@Body() body: { token: string; newPassword: string }) {
  try {
    await this.auth.resetPassword(body.token, body.newPassword);
    return { message: 'Password updated successfully.' };
  } catch {
    throw new Error('Reset link is invalid or has expired.');
  }
}

}