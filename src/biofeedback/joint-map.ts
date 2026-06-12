export type JointAreaKey =
  | 'SHOULDER'
  | 'ELBOW'
  | 'WRIST'
  | 'NECK'
  | 'HIP'
  | 'KNEE'
  | 'ANKLE'
  | 'LOWER_BACK';

export const ALL_JOINT_AREA_KEYS: JointAreaKey[] = [
  'SHOULDER',
  'ELBOW',
  'WRIST',
  'NECK',
  'HIP',
  'KNEE',
  'ANKLE',
  'LOWER_BACK',
];

const MUSCLE_JOINTS: Record<string, JointAreaKey[]> = {
  CHEST: ['SHOULDER', 'ELBOW'],
  BACK: ['SHOULDER', 'ELBOW', 'LOWER_BACK'],
  LATS: ['SHOULDER', 'ELBOW'],
  QUADS: ['KNEE', 'HIP'],
  HAMSTRINGS: ['KNEE', 'HIP'],
  GLUTES: ['HIP', 'LOWER_BACK'],
  FRONT_DELT: ['SHOULDER'],
  SIDE_DELT: ['SHOULDER'],
  REAR_DELT: ['SHOULDER'],
  BICEPS: ['ELBOW'],
  TRICEPS: ['ELBOW'],
  CALVES: ['ANKLE', 'KNEE'],
  LOWER_BACK: ['LOWER_BACK', 'HIP'],
  ABS: ['LOWER_BACK', 'HIP'],
};

const MOVEMENT_JOINTS: Record<string, JointAreaKey[]> = {
  HORIZONTAL_PUSH: ['SHOULDER', 'ELBOW'],
  VERTICAL_PUSH: ['SHOULDER', 'ELBOW', 'NECK'],
  HORIZONTAL_PULL: ['SHOULDER', 'ELBOW'],
  VERTICAL_PULL: ['SHOULDER', 'ELBOW'],
  SQUAT: ['KNEE', 'HIP', 'LOWER_BACK'],
  HINGE: ['HIP', 'LOWER_BACK', 'KNEE'],
  LUNGE: ['KNEE', 'HIP'],
  CARRY: ['SHOULDER', 'HIP', 'LOWER_BACK'],
  ISOLATION: [],
};

export function resolveJointsForExercise(input: {
  primaryMuscle: string;
  secondaryMuscles?: string[];
  movementPattern?: string | null;
}): JointAreaKey[] {
  const joints = new Set<JointAreaKey>();

  for (const muscle of [
    input.primaryMuscle,
    ...(input.secondaryMuscles ?? []),
  ]) {
    for (const joint of MUSCLE_JOINTS[muscle] ?? []) {
      joints.add(joint);
    }
  }

  if (input.movementPattern) {
    for (const joint of MOVEMENT_JOINTS[input.movementPattern] ?? []) {
      joints.add(joint);
    }
  }

  return [...joints];
}

export function mergeWorkoutJoints(
  exercises: Array<{
    primaryMuscle: string;
    secondaryMuscles?: string[];
    movementPattern?: string | null;
  }>,
): JointAreaKey[] {
  const joints = new Set<JointAreaKey>();
  for (const exercise of exercises) {
    for (const joint of resolveJointsForExercise(exercise)) {
      joints.add(joint);
    }
  }
  return [...joints];
}

/** Joints not in workout-derived set — for "somewhere else" picker. */
export function extraJointsForPicker(workoutJoints: JointAreaKey[]): JointAreaKey[] {
  const workoutSet = new Set(workoutJoints);
  return ALL_JOINT_AREA_KEYS.filter((j) => !workoutSet.has(j));
}
