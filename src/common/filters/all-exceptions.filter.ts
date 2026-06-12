import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import * as Sentry from '@sentry/nestjs';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const rawBody =
      exception instanceof HttpException
        ? exception.getResponse()
        : { statusCode: status, message: 'Internal server error' };

    const message =
      typeof rawBody === 'string'
        ? rawBody
        : ((rawBody as { message?: string | string[] }).message ??
          'Internal server error');

    const safeMessage = Array.isArray(message) ? message.join('; ') : message;

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `${request.method} ${request.url} — ${safeMessage}`,
        exception instanceof Error ? exception.stack : String(exception),
      );

      Sentry.withScope((scope) => {
        scope.setTag('http.method', request.method);
        scope.setTag('http.status_code', String(status));
        scope.setExtra('url', request.url);
        if (request.user && typeof request.user === 'object') {
          const user = request.user as { userId?: string; sub?: string };
          scope.setUser({ id: user.userId ?? user.sub });
        }
        Sentry.captureException(exception);
      });
    }

    const body =
      typeof rawBody === 'object' && rawBody !== null && !Array.isArray(rawBody)
        ? rawBody
        : { statusCode: status, message: safeMessage };

    response.status(status).json(body);
  }
}
