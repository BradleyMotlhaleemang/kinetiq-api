import {
  ArgumentsHost,
  Catch,
  ConflictException,
  ExceptionFilter,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import * as Sentry from '@sentry/nestjs';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception.code === 'P2002') {
      const fields = (exception.meta?.target as string[] | undefined)?.join(', ') ?? 'field';
      const body = {
        statusCode: 409,
        code: 'DUPLICATE_NAME_COLLISION',
        message: `A record with this ${fields} already exists.`,
      };
      response.status(409).json(body);
      return;
    }

    if (exception.code === 'P2025') {
      const body = {
        statusCode: 404,
        message: 'Record not found.',
      };
      response.status(404).json(body);
      return;
    }

    this.logger.error(
      `Prisma ${exception.code}: ${exception.message}`,
      exception.stack,
    );
    Sentry.captureException(exception, {
      tags: { prisma_code: exception.code },
    });

    response.status(500).json({
      statusCode: 500,
      message: 'Internal server error',
    });
  }
}

export function mapPrismaError(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      const fields = (error.meta?.target as string[] | undefined)?.join(', ') ?? 'field';
      throw new ConflictException({
        code: 'DUPLICATE_NAME_COLLISION',
        message: `A record with this ${fields} already exists.`,
      });
    }
    if (error.code === 'P2025') {
      throw new NotFoundException('Record not found.');
    }
  }
  throw error;
}
