export function deriveRpeTarget(repRangeMin: number, repRangeMax: number): number {
  const mid = (repRangeMin + repRangeMax) / 2;
  if (mid <= 6) return 8.5;
  if (mid <= 9) return 8;
  if (mid <= 12) return 7.5;
  return 7;
}

export function resolveRpeTarget(
  repRangeMin: number,
  repRangeMax: number,
  explicit?: number | null,
): number {
  if (typeof explicit === 'number' && explicit >= 6 && explicit <= 10) {
    return explicit;
  }
  return deriveRpeTarget(repRangeMin, repRangeMax);
}
