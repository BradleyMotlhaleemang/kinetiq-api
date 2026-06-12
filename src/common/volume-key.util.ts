export function toVolumeKey(value: string): string {
  const normalized = value.toUpperCase();
  if (normalized.includes('DELT') || normalized.includes('SHOULDER')) return 'SHOULDERS';
  if (normalized.includes('HAMSTRING')) return 'HAMSTRINGS';
  if (normalized.includes('GLUTE')) return 'GLUTES';
  if (normalized.includes('QUAD')) return 'QUADS';
  if (normalized.includes('TRICEP')) return 'TRICEPS';
  if (normalized.includes('BICEP')) return 'BICEPS';
  if (normalized.includes('CALF')) return 'CALVES';
  if (normalized.includes('AB')) return 'ABS';
  if (normalized.includes('CHEST')) return 'CHEST';
  if (normalized.includes('BACK') || normalized.includes('LATS')) return 'BACK';
  return normalized;
}
