import { PrescriptionDelta } from '../models/engine-context.model';

function safeRatio(numerator: number, denominator: number): number {
  if (!denominator || Number.isNaN(denominator)) return 0;
  return numerator / denominator;
}

export function buildPrescriptionDelta(input: {
  prescribedWeight: number;
  prescribedReps: number;
  prescribedSets: number;
  actualWeight: number;
  actualReps: number;
  actualSets: number;
}): PrescriptionDelta {
  const completionRate = safeRatio(input.actualSets, input.prescribedSets);
  const repCompletionRate = safeRatio(input.actualReps, input.prescribedReps);
  const weightAdherence = safeRatio(input.actualWeight, input.prescribedWeight);

  return {
    ...input,
    completionRate: Math.max(0, completionRate),
    repCompletionRate: Math.max(0, repCompletionRate),
    weightAdherence: Math.max(0, weightAdherence),
  };
}
