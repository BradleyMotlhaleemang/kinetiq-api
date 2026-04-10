import {
  Controller, Get, Patch, Param,
  UseGuards, Request, Query
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { NotificationsService } from './notifications.service';

@UseGuards(AuthGuard('jwt'))
@Controller('notifications')
export class NotificationsController {
  constructor(private notifications: NotificationsService) {}

  @Get()
  async getFeed(
    @Request() req: any,
    @Query('isRead') isRead?: string,
    @Query('pageSize') pageSize?: string,
    @Query('pageNumber') pageNumber?: string,
  ) {
    const result = await this.notifications.getFeed(req.user.userId, {
      isRead: isRead === undefined ? undefined : isRead === 'true',
      pageSize: pageSize ? parseInt(pageSize) : undefined,
      pageNumber: pageNumber ? parseInt(pageNumber) : undefined,
    });

    return {
      ...result,
      data: result.data.map((n) => ({
        ...n,
        redirectRoute: this.notifications.getRedirectRoute(n.type),
      })),
    };
  }

  @Get('unread-count')
  getUnreadCount(@Request() req: any) {
    return this.notifications.getUnreadCount(req.user.userId);
  }

  @Patch('read-all')
  markAllRead(@Request() req: any) {
    return this.notifications.markAllRead(req.user.userId);
  }

  @Patch(':id/read')
  markRead(@Request() req: any, @Param('id') id: string) {
    return this.notifications.markRead(req.user.userId, id);
  }
}