import { Injectable } from '@nestjs/common';
import { INTERPRETATION_THRESHOLDS } from '../constants/interpretation-matrix.constants';
import { EngineContext, EnginePhase } from '../models/engine-context.model';
import {
  InterpretationResult,
  PhysiologicalState,
} from '../models/interpretation.model';
import {
  classifyLocalFatigue,
  classifySystemicFatigue,
} from '../utils/fatigue-classifier.util';

@Injectable()
export class InterpretationService {
  interpret(context: EngineContext): InterpretationResult {
    if (context.enginePhase === EnginePhase.BASELINE) {
      return this.phaseResult(PhysiologicalState.BASELINE);
    }
    if (context.enginePhase === EnginePhase.CALIBRATING) {
      return this.phaseResult(PhysiologicalState.CALIBRATING);
    }

    const bio = context.biofeedback;
    if (!bio) return this.phaseResult(PhysiologicalState.CALIBRATING);

    const completionRate = context.prescriptionDelta?.completionRate ?? 1;
    const repCompletionRate = context.prescriptionDelta?.repCompletionRate ?? 1;
    const trend = this.computePerformanceTrend(context);
    const decliningPerformance = trend === 'DECLINING';
    const localFatigueScore = classifyLocalFatigue({
      sorenessScore: bio.sorenessScore,
      pumpScore: bio.pumpScore,
      completionRate,
    });
    const systemicFatigueScore = classifySystemicFatigue({
      effortScore: bio.effortScore,
      trainingDrive: bio.trainingDrive,
      decliningPerformance,
    });

    const highSoreness = bio.sorenessScore >= INTERPRETATION_THRESHOLDS.highSoreness;
    const highPerformance =
      completionRate >= INTERPRETATION_THRESHOLDS.productiveCompletionRate;
    const lowPerformance =
      completionRate < INTERPRETATION_THRESHOLDS.lowCompletionRate;
    const injuryRisk =
      bio.jointComfortScore >= INTERPRETATION_THRESHOLDS.highJointDiscomfort;

    let primaryState = PhysiologicalState.PRODUCTIVE_ADAPTATION;
    const reasoning: string[] = [];

    if (injuryRisk && trend !== 'DECLINING') {
      primaryState = PhysiologicalState.INJURY_RISK;
      reasoning.push('Joint discomfort is elevated while performance is stable.');
    } else if (
      bio.effortScore >= INTERPRETATION_THRESHOLDS.highEffort &&
      bio.trainingDrive <= INTERPRETATION_THRESHOLDS.lowDrive &&
      decliningPerformance
    ) {
      primaryState = PhysiologicalState.SYSTEMIC_FATIGUE;
      reasoning.push('High effort, low drive, and declining performance trend.');
    } else if (highSoreness && highPerformance) {
      primaryState = PhysiologicalState.PRODUCTIVE_ADAPTATION;
      reasoning.push('Soreness with high completion indicates productive adaptation.');
    } else if (highSoreness && lowPerformance) {
      primaryState = PhysiologicalState.UNDER_RECOVERY;
      reasoning.push('Soreness and under-completion indicate incomplete recovery.');
    } else if (
      bio.sorenessScore < INTERPRETATION_THRESHOLDS.highSoreness &&
      bio.pumpScore <= INTERPRETATION_THRESHOLDS.lowPump &&
      trend === 'STAGNANT'
    ) {
      primaryState = PhysiologicalState.INSUFFICIENT_STIMULUS;
      reasoning.push('Low pump and stagnant trend indicate stimulus may be too low.');
    } else if (
      completionRate < INTERPRETATION_THRESHOLDS.aggressivePrescriptionRate &&
      repCompletionRate < INTERPRETATION_THRESHOLDS.aggressivePrescriptionRate
    ) {
      primaryState = PhysiologicalState.AGGRESSIVE_PRESCRIPTION;
      reasoning.push('Recent adherence rates suggest prior prescription was aggressive.');
    } else if (
      bio.pumpScore >= INTERPRETATION_THRESHOLDS.highPump &&
      bio.sorenessScore < INTERPRETATION_THRESHOLDS.highSoreness &&
      trend !== 'DECLINING'
    ) {
      primaryState = PhysiologicalState.PRODUCTIVE_ADAPTATION;
      reasoning.push('High pump and stable trend support productive adaptation.');
    } else if (localFatigueScore >= 7) {
      primaryState = PhysiologicalState.LOCAL_FATIGUE;
      reasoning.push('Local fatigue score is elevated.');
    }

    const stimulusSufficiency =
      primaryState === PhysiologicalState.INSUFFICIENT_STIMULUS
        ? 'INSUFFICIENT'
        : primaryState === PhysiologicalState.PRODUCTIVE_ADAPTATION
          ? 'PRODUCTIVE'
          : primaryState === PhysiologicalState.SYSTEMIC_FATIGUE ||
              primaryState === PhysiologicalState.UNDER_RECOVERY
            ? 'EXCESSIVE'
            : 'ADEQUATE';

    return {
      primaryState,
      secondaryState: null,
      stimulusSufficiency,
      localFatigueScore,
      systemicFatigueScore,
      injuryRiskFlag: injuryRisk,
      reasoning,
    };
  }

  private phaseResult(state: PhysiologicalState): InterpretationResult {
    return {
      primaryState: state,
      secondaryState: null,
      stimulusSufficiency: 'ADEQUATE',
      localFatigueScore: 0,
      systemicFatigueScore: 0,
      injuryRiskFlag: false,
      reasoning: ['Insufficient session depth; using conservative interpretation.'],
    };
  }

  private computePerformanceTrend(
    context: EngineContext,
  ): 'IMPROVING' | 'STAGNANT' | 'DECLINING' {
    const rows = context.performanceHistory.slice(0, 3);
    if (rows.length < 3) return 'STAGNANT';
    const latest = rows[0]?.bestE1rm ?? 0;
    const oldest = rows[2]?.bestE1rm ?? 0;
    if (oldest <= 0) return 'STAGNANT';
    const ratio = (latest - oldest) / oldest;
    if (ratio > 0.02) return 'IMPROVING';
    if (ratio < -0.02) return 'DECLINING';
    return 'STAGNANT';
  }
}
