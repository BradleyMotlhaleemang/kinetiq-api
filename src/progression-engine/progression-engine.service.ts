import { Injectable } from '@nestjs/common';
import { ExerciseCategory } from '@prisma/client';
import { ConfidenceService } from './layers/confidence.service';
import { DecisionService } from './layers/decision.service';
import {
  BuildContextInput,
  InputAggregatorService,
} from './layers/input-aggregator.service';
import { InterpretationService } from './layers/interpretation.service';
import { PrescriptionBuilderService } from './layers/prescription-builder.service';
import { ProgressionAction as EngineProgressionAction } from './models/engine-output.model';

export type ProgressionAction = `${EngineProgressionAction}`;

export interface ProgressionResult {
  action: ProgressionAction;
  weightTarget: number;
  repRangeLow: number;
  repRangeHigh: number;
  setTarget: number;
  reason: string;
}

@Injectable()
export class ProgressionEngineService {
  constructor(
    private readonly inputAggregator: InputAggregatorService,
    private readonly interpretationService: InterpretationService,
    private readonly confidenceService: ConfidenceService,
    private readonly decisionService: DecisionService,
    private readonly prescriptionBuilderService: PrescriptionBuilderService,
  ) {}

  async evaluate(
    userId: string,
    exerciseId: string,
    exerciseCategory: ExerciseCategory,
    currentWeight: number,
    lastRepCount: number,
    lastSetCount: number,
    targetRepRangeLow: number | null,
    targetRepRangeHigh: number | null,
    sorenessScore: number,
    pumpScore: number | null,
    volumeSignal: number | null,
    jointPainScore: number,
    effortScore: number | null,
    effortScoreHistory: (number | null)[],
    goalModeMultiplier: number,
    goalMode: string,
    experienceLevel: string,
    weekNumber: number,
    templateSetCount: number,
  ): Promise<ProgressionResult> {
    const contextInput: BuildContextInput = {
      userId,
      exerciseId,
      exerciseCategory,
      currentWeight,
      currentRepCount: lastRepCount,
      currentSetCount: lastSetCount,
      targetRepRangeLow,
      targetRepRangeHigh,
      sorenessScore,
      pumpScore,
      volumeSignal,
      jointComfortScore: jointPainScore,
      effortScore,
      trainingDrive: null,
      sessionPerformance: null,
      goalMode,
      experienceLevel,
      weekNumber,
      templateSetCount,
    };

    const context = await this.inputAggregator.buildContext(contextInput);
    const interpretation = this.interpretationService.interpret(context);
    const confidence = this.confidenceService.score(context, interpretation);
    const decision = this.decisionService.decide(
      context,
      interpretation,
      confidence,
    );
    const output = this.prescriptionBuilderService.build(
      context,
      decision,
      confidence,
      interpretation.primaryState,
    );

    const reason =
      output.coachingNote && output.coachingNote.length > 0
        ? `${output.reason} ${output.coachingNote}`
        : output.reason;

    return {
      action: output.action,
      weightTarget: output.weightTarget,
      repRangeLow: output.repRangeLow,
      repRangeHigh: output.repRangeHigh,
      setTarget: output.setTarget,
      reason,
    };
  }
}
