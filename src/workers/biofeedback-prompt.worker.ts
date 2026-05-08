import { Processor, Process } from '@nestjs/bull';
import type { Job } from 'bull';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

export const BIOFEEDBACK_PROMPT_QUEUE = 'biofeedback-prompt';

export const BIOFEEDBACK_PROMPT_DELAY_2H_MS = 2 * 60 * 60 * 1000;

export function getMsUntilNextDay11am(from: Date = new Date()): number {
  const target = new Date(from);
  target.setDate(target.getDate() + 1);
  target.setHours(11, 0, 0, 0);
  return target.getTime() - from.getTime();
}

@Injectable()
@Processor(BIOFEEDBACK_PROMPT_QUEUE)
export class BiofeedbackPromptWorker {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  @Process('prompt')
  async handlePrompt(job: Job<{ userId: string; workoutId: string }>) {
    const { userId, workoutId } = job.data;

    const alreadySubmitted = await this.prisma.bioFeedback.findFirst({
      where: { workoutId },
    });

    if (alreadySubmitted) return;

    await this.notifications.create(userId, 'BIOFEEDBACK_PROMPT', {
      workoutId,
    });
  }
}
