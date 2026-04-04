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
}