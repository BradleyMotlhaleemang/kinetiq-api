import { Controller, Get, Patch, Body, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';

@UseGuards(AuthGuard('jwt'))
@Controller('users')
export class UsersController {
  constructor(private users: UsersService) {}

  @Get('me')
  getMe(@Request() req: any) {
    return this.users.findById(req.user.userId);
  }

  @Patch('me/onboarding')
  updateOnboarding(
    @Request() req: any,
    @Body() body: {
      gender?: string;
      dateOfBirth?: string;
      bodyweightKg?: number;
      goalMode?: string;
      experienceLevel?: string;
      trainingAgeMths?: number;
      notificationsEnabled?: boolean;
      preferredTrainingTime?: string;
    },
  ) {
    return this.users.updateOnboarding(req.user.userId, body);
  }
}