import { Prisma } from '@prisma/client';

const MUSCLE_DISPLAY: Record<string, string> = {
  CHEST: 'Chest',
  BACK: 'Back',
  LATS: 'Back',
  FRONT_DELT: 'Shoulders',
  SIDE_DELT: 'Shoulders',
  REAR_DELT: 'Rear Delts',
  BICEPS: 'Biceps',
  TRICEPS: 'Triceps',
  QUADS: 'Quads',
  HAMSTRINGS: 'Hamstrings',
  GLUTES: 'Glutes',
  CALVES: 'Calves',
  LOWER_BACK: 'Lower Back',
};

const LABEL_MUSCLE_MAP: [string, string][] = [
  ['push', 'Chest · Shoulders · Triceps'],
  ['pull', 'Back · Biceps · Rear Delts'],
  ['leg', 'Quads · Hamstrings · Glutes · Calves'],
  ['lower', 'Quads · Hamstrings · Glutes · Calves'],
  ['upper', 'Chest · Back · Shoulders · Arms'],
  ['full body', 'Full Body'],
  ['full', 'Full Body'],
];

type PrescriptionSnapshot = {
  splitLabel?: string;
  exercises?: Array<{ primaryMuscle?: string | null }>;
};

export function deriveDayLabel(
  splitDayLabel: string | null | undefined,
  prescription: Prisma.JsonValue | null,
): string {
  if (prescription && typeof prescription === 'object' && prescription !== null) {
    const snap = prescription as PrescriptionSnapshot;
    if (snap.splitLabel) return snap.splitLabel;
  }
  if (splitDayLabel) {
    const match = splitDayLabel.match(/-\s*(.+)$/);
    if (match?.[1]) return match[1].trim();
    return splitDayLabel;
  }
  return 'Session';
}

export function deriveMuscleSummary(
  prescription: Prisma.JsonValue | null,
  dayLabel: string,
): string | null {
  if (prescription && typeof prescription === 'object' && prescription !== null) {
    const snap = prescription as PrescriptionSnapshot;
    if (Array.isArray(snap.exercises) && snap.exercises.length > 0) {
      const muscles = new Set<string>();
      for (const ex of snap.exercises) {
        if (ex.primaryMuscle) {
          muscles.add(MUSCLE_DISPLAY[ex.primaryMuscle] ?? ex.primaryMuscle);
        }
      }
      if (muscles.size > 0) {
        return Array.from(muscles).slice(0, 4).join(' · ');
      }
    }
  }
  const lower = dayLabel.toLowerCase();
  for (const [key, value] of LABEL_MUSCLE_MAP) {
    if (lower.includes(key)) return value;
  }
  return null;
}
