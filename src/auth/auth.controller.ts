import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
  Query,
  Res,
  Req,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import type { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { AuditContext } from './auth-audit.service';

function auditFromRequest(req: ExpressRequest): AuditContext {
  return {
    ipAddress: req.ip || req.socket?.remoteAddress,
    userAgent: req.headers['user-agent'],
  };
}

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('register')
  register(@Body() body: RegisterDto, @Req() req: ExpressRequest) {
    return this.auth.register(body.email, body.password, body.displayName, auditFromRequest(req));
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('login')
  login(@Body() body: LoginDto, @Req() req: ExpressRequest, @Res({ passthrough: true }) res: any) {
    return this.auth.login(body.email, body.password, auditFromRequest(req), res);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  me(@Request() req: { user: { userId: string; email: string } }) {
    return req.user;
  }

  @Get('verify-email')
  verifyEmail(@Query() query: VerifyEmailDto, @Req() req: ExpressRequest) {
    return this.auth.verifyEmail(query.token, auditFromRequest(req));
  }

  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('resend-verification')
  resendVerification(@Body() body: ResendVerificationDto, @Req() req: ExpressRequest) {
    return this.auth.resendVerification(body.email, auditFromRequest(req));
  }

  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('forgot-password')
  async forgotPassword(@Body() body: ForgotPasswordDto, @Req() req: ExpressRequest) {
    await this.auth.forgotPassword(body.email, auditFromRequest(req));
    return { message: 'If that email is registered, you will receive a reset link shortly.' };
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('reset-password')
  async resetPassword(@Body() body: ResetPasswordDto, @Req() req: ExpressRequest) {
    await this.auth.resetPassword(body.token, body.newPassword, auditFromRequest(req));
    return { message: 'Password updated successfully.' };
  }

  @Post('refresh')
  refresh(@Req() req: any, @Res({ passthrough: true }) res: any) {
    return this.auth.refresh(req, res, auditFromRequest(req));
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('logout')
  logout(
    @Request() req: { user?: { userId: string } },
    @Req() expressReq: ExpressRequest,
    @Res({ passthrough: true }) res: any,
  ) {
    return this.auth.logout(req.user?.userId, auditFromRequest(expressReq), res);
  }
}
