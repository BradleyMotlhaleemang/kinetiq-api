import { Module } from '@nestjs/common';
import { WeeklyFeedbackService } from './weekly-feedback.service';
import { WeeklyFeedbackController } from './weekly-feedback.controller';

@Module({
  providers: [WeeklyFeedbackService],
  controllers: [WeeklyFeedbackController],
  exports: [WeeklyFeedbackService],
})
export class WeeklyFeedbackModule {}
