import { Injectable } from '@nestjs/common';
import { ExerciseCategory } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
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
    private readonly prisma: PrismaService,
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

    const result: ProgressionResult = {
      action: output.action,
      weightTarget: output.weightTarget,
      repRangeLow: output.repRangeLow,
      repRangeHigh: output.repRangeHigh,
      setTarget: output.setTarget,
      reason,
    };

    await this.writeProgressionLog(
      userId,
      exerciseId,
      context,
      output.action,
      result,
      confidence.level,
      output.enginePhase,
      output.physiologicalState,
      effortScoreHistory,
      goalModeMultiplier,
    );

    return result;
  }

  private async writeProgressionLog(
    userId: string,
    exerciseId: string,
    context: Awaited<ReturnType<InputAggregatorService['buildContext']>>,
    action: ProgressionAction,
    result: ProgressionResult,
    confidenceLevel: string,
    enginePhase: string,
    physiologicalState: string,
    effortScoreHistory: (number | null)[],
    goalModeMultiplier: number,
  ) {
    await this.prisma.progressionLog.create({
      data: {
        userId,
        exerciseId,
        action,
        weightTarget: result.weightTarget,
        prescribedWeight: context.prescriptionDelta?.prescribedWeight ?? null,
        prescribedReps: context.prescriptionDelta?.prescribedReps ?? null,
        prescribedSets: context.prescriptionDelta?.prescribedSets ?? null,
        actualWeight: context.prescriptionDelta?.actualWeight ?? null,
        actualReps: context.prescriptionDelta?.actualReps ?? null,
        actualSets: context.prescriptionDelta?.actualSets ?? null,
        completionRate: context.prescriptionDelta?.completionRate ?? null,
        repCompletionRate: context.prescriptionDelta?.repCompletionRate ?? null,
        physiologicalState,
        confidenceLevel,
        enginePhase,
        status: 'PENDING',
        reason: result.reason,
        contextSnapshot: {
          sorenessScore: context.biofeedback?.sorenessScore ?? 0,
          pumpScore: context.biofeedback?.pumpScore ?? null,
          volumeSignal: context.biofeedback?.volumeSignal ?? null,
          effortScore: context.biofeedback?.effortScore ?? null,
          effortScoreHistory,
          goalModeMultiplier,
          exerciseCategory: context.exerciseCategory,
          weekNumber: context.weekNumber,
          targetRepRangeLow: result.repRangeLow,
          targetRepRangeHigh: result.repRangeHigh,
          setTarget: result.setTarget,
        } as any,
      },
    });
  }
}
