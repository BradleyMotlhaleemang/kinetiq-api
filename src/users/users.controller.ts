import { Controller, Get, Patch, Body, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';
import { transformUser } from '../common/transforms';

@UseGuards(AuthGuard('jwt'))
@Controller('users')
export class UsersController {
  constructor(private users: UsersService) {}

  @Get('me')
  async getMe(@Request() req: any) {
    const user = await this.users.findById(req.user.userId);
    return transformUser(user);
  }

  @Patch('me/onboarding')
  async updateOnboarding(
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
    const user = await this.users.updateOnboarding(req.user.userId, body);
    return transformUser(user);
  }
}