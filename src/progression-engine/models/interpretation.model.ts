export enum PhysiologicalState {
  PRODUCTIVE_ADAPTATION = 'PRODUCTIVE_ADAPTATION',
  LOCAL_FATIGUE = 'LOCAL_FATIGUE',
  SYSTEMIC_FATIGUE = 'SYSTEMIC_FATIGUE',
  UNDER_RECOVERY = 'UNDER_RECOVERY',
  INSUFFICIENT_STIMULUS = 'INSUFFICIENT_STIMULUS',
  INJURY_RISK = 'INJURY_RISK',
  AGGRESSIVE_PRESCRIPTION = 'AGGRESSIVE_PRESCRIPTION',
  CALIBRATING = 'CALIBRATING',
  BASELINE = 'BASELINE',
}

export interface InterpretationResult {
  primaryState: PhysiologicalState;
  secondaryState: PhysiologicalState | null;
  stimulusSufficiency: 'INSUFFICIENT' | 'ADEQUATE' | 'PRODUCTIVE' | 'EXCESSIVE';
  localFatigueScore: number;
  systemicFatigueScore: number;
  injuryRiskFlag: boolean;
  reasoning: string[];
}
