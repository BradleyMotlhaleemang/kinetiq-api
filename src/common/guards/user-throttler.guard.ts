import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

type RequestWithUser = {
  ip?: string;
  user?: { userId?: string };
  headers?: { authorization?: string };
};

function userIdFromBearerToken(authorization?: string): string | undefined {
  if (!authorization?.startsWith('Bearer ')) return undefined;
  const token = authorization.slice(7);
  const parts = token.split('.');
  if (parts.length !== 3) return undefined;
  try {
    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64url').toString('utf8'),
    ) as { sub?: string };
    return payload.sub;
  } catch {
    return undefined;
  }
}

@Injectable()
export class UserThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: RequestWithUser): Promise<string> {
    const userId = req.user?.userId ?? userIdFromBearerToken(req.headers?.authorization);
    if (userId) {
      return `user:${userId}`;
    }
    return `ip:${req.ip ?? 'unknown'}`;
  }
}
