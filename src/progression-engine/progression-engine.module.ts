import { Module } from '@nestjs/common';
import { ProgressionModule } from '../engine/progression/progression.module';
import { ConfidenceService } from './layers/confidence.service';
import { DecisionService } from './layers/decision.service';
import { InputAggregatorService } from './layers/input-aggregator.service';
import { InterpretationService } from './layers/interpretation.service';
import { PrescriptionBuilderService } from './layers/prescription-builder.service';
import { ProgressionEngineService } from './progression-engine.service';

@Module({
  imports: [ProgressionModule],
  providers: [
    ProgressionEngineService,
    InputAggregatorService,
    InterpretationService,
    ConfidenceService,
    DecisionService,
    PrescriptionBuilderService,
  ],
  exports: [ProgressionEngineService],
})
export class ProgressionEngineModule {}