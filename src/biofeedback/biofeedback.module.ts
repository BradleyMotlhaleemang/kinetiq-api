import { Module } from '@nestjs/common';
import { BiofeedbackService } from './biofeedback.service';
import { BiofeedbackController } from './biofeedback.controller';

@Module({
  providers: [BiofeedbackService],
  controllers: [BiofeedbackController],
  exports: [BiofeedbackService],
})
export class BiofeedbackModule {}