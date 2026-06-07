import { Injectable } from '@nestjs/common';

type AuthLogPayload = {
  event: string;
  reason?: string;
  userId?: string;
  emailHash?: string;
  ipAddress?: string;
};

@Injectable()
export class AuthLogger {
  logAuthEvent(payload: AuthLogPayload): void {
    const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const parts = [
      timestamp,
      payload.event,
      payload.reason ? `reason=${payload.reason}` : null,
      payload.userId ? `userId=${payload.userId}` : null,
      payload.emailHash ? `emailHash=${payload.emailHash}` : null,
      payload.ipAddress ? `ip=${payload.ipAddress}` : null,
    ].filter(Boolean);

    console.log(parts.join(' | '));
  }
}
