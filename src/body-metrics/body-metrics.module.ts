import { Module } from '@nestjs/common';
import { BodyMetricsService } from './body-metrics.service';
import { BodyMetricsController } from './body-metrics.controller';

@Module({
  providers: [BodyMetricsService],
  controllers: [BodyMetricsController],
  exports: [BodyMetricsService],
})
export class BodyMetricsModule {}