export type ExperienceLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
export type TrainingGoal = 'HYPERTROPHY' | 'STRENGTH' | 'RECOMPOSITION'

export type WorkoutExerciseTemplate = {
  name: string
  orderIndex: number
  setsTarget: number
  repRangeMin: number
  repRangeMax: number
}

export type WorkoutDayTemplate = {
  label: string
  type: 'WORKOUT' | 'REST'
  exercises?: WorkoutExerciseTemplate[]
}

export type SplitTemplate = {
  name: string
  slug: string
  daysPerWeek: number
  level: ExperienceLevel
  experienceTags: ExperienceLevel[]
  goal: TrainingGoal
  goalTags: TrainingGoal[]
  description: string
  dayStructure: string[]
  days: WorkoutDayTemplate[]
}

const fullBody3x: SplitTemplate = {
  name: 'Full Body 3x',
  slug: 'full-body-3x',
  daysPerWeek: 3,
  level: 'BEGINNER',
  experienceTags: ['BEGINNER', 'INTERMEDIATE'],
  goal: 'RECOMPOSITION',
  goalTags: ['RECOMPOSITION', 'HYPERTROPHY'],
  description:
    'Three full-body sessions per week hitting every major muscle group each session. Ideal for beginners building a strength and composition base with manageable recovery demands.',
  dayStructure: ['Full Body A', 'Rest', 'Full Body B', 'Rest', 'Full Body C', 'Rest', 'Rest'],
  days: [
    {
      label: 'Full Body A',
      type: 'WORKOUT',
      exercises: [
        { name: 'Barbell Back Squat', orderIndex: 0, setsTarget: 3, repRangeMin: 6, repRangeMax: 10 },
        { name: 'Barbell Bench Press', orderIndex: 1, setsTarget: 3, repRangeMin: 6, repRangeMax: 10 },
        { name: 'Barbell Row', orderIndex: 2, setsTarget: 3, repRangeMin: 6, repRangeMax: 10 },
        { name: 'Romanian Deadlift', orderIndex: 3, setsTarget: 3, repRangeMin: 8, repRangeMax: 12 },
        { name: 'Dumbbell Shoulder Press', orderIndex: 4, setsTarget: 3, repRangeMin: 8, repRangeMax: 12 },
        { name: 'Dumbbell Curl', orderIndex: 5, setsTarget: 2, repRangeMin: 10, repRangeMax: 15 },
        { name: 'Tricep Pushdown', orderIndex: 6, setsTarget: 2, repRangeMin: 10, repRangeMax: 15 },
        { name: 'Calf Raise', orderIndex: 7, setsTarget: 2, repRangeMin: 12, repRangeMax: 20 },
      ],
    },
    { label: 'Rest', type: 'REST' },
    {
      label: 'Full Body B',
      type: 'WORKOUT',
      exercises: [
        { name: 'Conventional Deadlift', orderIndex: 0, setsTarget: 3, repRangeMin: 6, repRangeMax: 10 },
        { name: 'Dumbbell Incline Press', orderIndex: 1, setsTarget: 3, repRangeMin: 8, repRangeMax: 12 },
        { name: 'Lat Pulldown', orderIndex: 2, setsTarget: 3, repRangeMin: 8, repRangeMax: 12 },
        { name: 'Leg Press', orderIndex: 3, setsTarget: 3, repRangeMin: 8, repRangeMax: 12 },
        { name: 'Dumbbell Lateral Raise', orderIndex: 4, setsTarget: 3, repRangeMin: 12, repRangeMax: 20 },
        { name: 'Cable Fly', orderIndex: 5, setsTarget: 2, repRangeMin: 12, repRangeMax: 15 },
        { name: 'Hammer Curl', orderIndex: 6, setsTarget: 2, repRangeMin: 10, repRangeMax: 15 },
        { name: 'Seated Calf Raise', orderIndex: 7, setsTarget: 2, repRangeMin: 12, repRangeMax: 20 },
      ],
    },
    { label: 'Rest', type: 'REST' },
    {
      label: 'Full Body C',
      type: 'WORKOUT',
      exercises: [
        { name: 'Goblet Squat', orderIndex: 0, setsTarget: 3, repRangeMin: 8, repRangeMax: 12 },
        { name: 'Dumbbell Flat Press', orderIndex: 1, setsTarget: 3, repRangeMin: 8, repRangeMax: 12 },
        { name: 'Cable Row', orderIndex: 2, setsTarget: 3, repRangeMin: 8, repRangeMax: 12 },
        { name: 'Hip Thrust', orderIndex: 3, setsTarget: 3, repRangeMin: 10, repRangeMax: 15 },
        { name: 'Machine Shoulder Press', orderIndex: 4, setsTarget: 3, repRangeMin: 10, repRangeMax: 15 },
        { name: 'Face Pull', orderIndex: 5, setsTarget: 2, repRangeMin: 15, repRangeMax: 20 },
        { name: 'Cable Curl', orderIndex: 6, setsTarget: 2, repRangeMin: 12, repRangeMax: 15 },
        { name: 'Calf Raise', orderIndex: 7, setsTarget: 2, repRangeMin: 15, repRangeMax: 20 },
      ],
    },
    { label: 'Rest', type: 'REST' },
    { label: 'Rest', type: 'REST' },
  ],
}

const fullBody4x: SplitTemplate = {
  name: 'Full Body 4x',
  slug: 'full-body-4x',
  daysPerWeek: 4,
  level: 'INTERMEDIATE',
  experienceTags: ['INTERMEDIATE'],
  goal: 'HYPERTROPHY',
  goalTags: ['HYPERTROPHY', 'RECOMPOSITION'],
  description:
    'Four full-body sessions per week with A/B/C/D variation. Higher weekly frequency drives hypertrophy while rotating compound movements manages cumulative fatigue.',
  dayStructure: ['Full Body A', 'Full Body B', 'Rest', 'Full Body C', 'Full Body D', 'Rest', 'Rest'],
  days: [
    {
      label: 'Full Body A',
      type: 'WORKOUT',
      exercises: [
        { name: 'Barbell Back Squat', orderIndex: 0, setsTarget: 4, repRangeMin: 6, repRangeMax: 10 },
        { name: 'Barbell Bench Press', orderIndex: 1, setsTarget: 4, repRangeMin: 6, repRangeMax: 10 },
        { name: 'Barbell Row', orderIndex: 2, setsTarget: 4, repRangeMin: 6, repRangeMax: 10 },
        { name: 'Romanian Deadlift', orderIndex: 3, setsTarget: 3, repRangeMin: 8, repRangeMax: 12 },
        { name: 'Dumbbell Shoulder Press', orderIndex: 4, setsTarget: 3, repRangeMin: 8, repRangeMax: 12 },
        { name: 'Dumbbell Curl', orderIndex: 5, setsTarget: 2, repRangeMin: 10, repRangeMax: 15 },
        { name: 'Tricep Pushdown', orderIndex: 6, setsTarget: 2, repRangeMin: 10, repRangeMax: 15 },
      ],
    },
    {
      label: 'Full Body B',
      type: 'WORKOUT',
      exercises: [
        { name: 'Conventional Deadlift', orderIndex: 0, setsTarget: 4, repRangeMin: 5, repRangeMax: 8 },
        { name: 'Barbell Incline Bench Press', orderIndex: 1, setsTarget: 4, repRangeMin: 6, repRangeMax: 10 },
        { name: 'Pull-Up', orderIndex: 2, setsTarget: 4, repRangeMin: 6, repRangeMax: 10 },
        { name: 'Bulgarian Split Squat', orderIndex: 3, setsTarget: 3, repRangeMin: 8, repRangeMax: 12 },
        { name: 'Dumbbell Lateral Raise', orderIndex: 4, setsTarget: 3, repRangeMin: 12, repRangeMax: 20 },
        { name: 'Hammer Curl', orderIndex: 5, setsTarget: 2, repRangeMin: 10, repRangeMax: 15 },
        { name: 'Overhead Tricep Extension', orderIndex: 6, setsTarget: 2, repRangeMin: 10, repRangeMax: 15 },
      ],
    },
    { label: 'Rest', type: 'REST' },
    {
      label: 'Full Body C',
      type: 'WORKOUT',
      exercises: [
        { name: 'Leg Press', orderIndex: 0, setsTarget: 4, repRangeMin: 8, repRangeMax: 12 },
        { name: 'Dumbbell Flat Press', orderIndex: 1, setsTarget: 4, repRangeMin: 8, repRangeMax: 12 },
        { name: 'Cable Row', orderIndex: 2, setsTarget: 4, repRangeMin: 8, repRangeMax: 12 },
        { name: 'Hip Thrust', orderIndex: 3, setsTarget: 3, repRangeMin: 10, repRangeMax: 15 },
        { name: 'Machine Shoulder Press', orderIndex: 4, setsTarget: 3, repRangeMin: 10, repRangeMax: 15 },
        { name: 'Cable Curl', orderIndex: 5, setsTarget: 2, repRangeMin: 12, repRangeMax: 15 },
        { name: 'Cable Rope Pushdown', orderIndex: 6, setsTarget: 2, repRangeMin: 12, repRangeMax: 15 },
        { name: 'Seated Calf Raise', orderIndex: 7, setsTarget: 2, repRangeMin: 15, repRangeMax: 20 },
      ],
    },
    {
      label: 'Full Body D',
      type: 'WORKOUT',
      exercises: [
        { name: 'Hack Squat', orderIndex: 0, setsTarget: 4, repRangeMin: 8, repRangeMax: 12 },
        { name: 'Dumbbell Incline Press', orderIndex: 1, setsTarget: 4, repRangeMin: 8, repRangeMax: 12 },
        { name: 'Lat Pulldown', orderIndex: 2, setsTarget: 4, repRangeMin: 8, repRangeMax: 12 },
        { name: 'Dumbbell Romanian Deadlift', orderIndex: 3, setsTarget: 3, repRangeMin: 10, repRangeMax: 15 },
        { name: 'Arnold Press', orderIndex: 4, setsTarget: 3, repRangeMin: 10, repRangeMax: 15 },
        { name: 'Pec Deck', orderIndex: 5, setsTarget: 2, repRangeMin: 12, repRangeMax: 15 },
        { name: 'Face Pull', orderIndex: 6, setsTarget: 2, repRangeMin: 15, repRangeMax: 20 },
        { name: 'Calf Raise', orderIndex: 7, setsTarget: 2, repRangeMin: 15, repRangeMax: 20 },
      ],
    },
    { label: 'Rest', type: 'REST' },
    { label: 'Rest', type: 'REST' },
  ],
}

const upperLower4x: SplitTemplate = {
  name: 'Upper Lower 4x',
  slug: 'upper-lower-4x',
  daysPerWeek: 4,
  level: 'INTERMEDIATE',
  experienceTags: ['BEGINNER', 'INTERMEDIATE'],
  goal: 'HYPERTROPHY',
  goalTags: ['HYPERTROPHY'],
  description:
    'Classic 4-day upper/lower split with A/B variation. Hits each muscle group twice per week with dedicated sessions for upper and lower body, ideal for hypertrophy.',
  dayStructure: ['Upper A', 'Lower A', 'Rest', 'Upper B', 'Lower B', 'Rest', 'Rest'],
  days: [
    {
      label: 'Upper A',
      type: 'WORKOUT',
      exercises: [
        { name: 'Barbell Bench Press', orderIndex: 0, setsTarget: 4, repRangeMin: 6, repRangeMax: 10 },
        { name: 'Barbell Row', orderIndex: 1, setsTarget: 4, repRangeMin: 6, repRangeMax: 10 },
        { name: 'Barbell Incline Bench Press', orderIndex: 2, setsTarget: 3, repRangeMin: 8, repRangeMax: 12 },
        { name: 'Dumbbell Row', orderIndex: 3, setsTarget: 3, repRangeMin: 8, repRangeMax: 12 },
        { name: 'Dumbbell Shoulder Press', orderIndex: 4, setsTarget: 3, repRangeMin: 8, repRangeMax: 12 },
        { name: 'Cable Fly', orderIndex: 5, setsTarget: 2, repRangeMin: 12, repRangeMax: 15 },
        { name: 'Dumbbell Lateral Raise', orderIndex: 6, setsTarget: 2, repRangeMin: 15, repRangeMax: 20 },
        { name: 'Barbell Curl', orderIndex: 7, setsTarget: 2, repRangeMin: 10, repRangeMax: 15 },
        { name: 'Tricep Pushdown', orderIndex: 8, setsTarget: 2, repRangeMin: 10, repRangeMax: 15 },
      ],
    },
    {
      label: 'Lower A',
      type: 'WORKOUT',
      exercises: [
        { name: 'Barbell Back Squat', orderIndex: 0, setsTarget: 4, repRangeMin: 6, repRangeMax: 10 },
        { name: 'Romanian Deadlift', orderIndex: 1, setsTarget: 4, repRangeMin: 8, repRangeMax: 12 },
        { name: 'Leg Press', orderIndex: 2, setsTarget: 3, repRangeMin: 8, repRangeMax: 12 },
        { name: 'Leg Curl', orderIndex: 3, setsTarget: 3, repRangeMin: 10, repRangeMax: 15 },
        { name: 'Leg Extension', orderIndex: 4, setsTarget: 3, repRangeMin: 10, repRangeMax: 15 },
        { name: 'Hip Thrust', orderIndex: 5, setsTarget: 3, repRangeMin: 10, repRangeMax: 15 },
        { name: 'Calf Raise', orderIndex: 6, setsTarget: 3, repRangeMin: 12, repRangeMax: 20 },
      ],
    },
    { label: 'Rest', type: 'REST' },
    {
      label: 'Upper B',
      type: 'WORKOUT',
      exercises: [
        { name: 'Barbell Overhead Press', orderIndex: 0, setsTarget: 4, repRangeMin: 6, repRangeMax: 10 },
        { name: 'Wide Grip Lat Pulldown', orderIndex: 1, setsTarget: 4, repRangeMin: 8, repRangeMax: 12 },
        { name: 'Dumbbell Incline Press', orderIndex: 2, setsTarget: 3, repRangeMin: 8, repRangeMax: 12 },
        { name: 'Cable Row', orderIndex: 3, setsTarget: 3, repRangeMin: 8, repRangeMax: 12 },
        { name: 'Arnold Press', orderIndex: 4, setsTarget: 3, repRangeMin: 10, repRangeMax: 15 },
        { name: 'Cable Incline Fly', orderIndex: 5, setsTarget: 2, repRangeMin: 12, repRangeMax: 15 },
        { name: 'Face Pull', orderIndex: 6, setsTarget: 2, repRangeMin: 15, repRangeMax: 20 },
        { name: 'Hammer Curl', orderIndex: 7, setsTarget: 2, repRangeMin: 10, repRangeMax: 15 },
        { name: 'Overhead Tricep Extension', orderIndex: 8, setsTarget: 2, repRangeMin: 10, repRangeMax: 15 },
      ],
    },
    {
      label: 'Lower B',
      type: 'WORKOUT',
      exercises: [
        { name: 'Conventional Deadlift', orderIndex: 0, setsTarget: 4, repRangeMin: 6, repRangeMax: 8 },
        { name: 'Bulgarian Split Squat', orderIndex: 1, setsTarget: 3, repRangeMin: 8, repRangeMax: 12 },
        { name: 'Hack Squat', orderIndex: 2, setsTarget: 3, repRangeMin: 8, repRangeMax: 12 },
        { name: 'Seated Leg Curl', orderIndex: 3, setsTarget: 3, repRangeMin: 10, repRangeMax: 15 },
        { name: 'Hip Abduction Machine', orderIndex: 4, setsTarget: 3, repRangeMin: 12, repRangeMax: 20 },
        { name: 'Glute Bridge', orderIndex: 5, setsTarget: 3, repRangeMin: 12, repRangeMax: 15 },
        { name: 'Seated Calf Raise', orderIndex: 6, setsTarget: 3, repRangeMin: 15, repRangeMax: 20 },
      ],
    },
    { label: 'Rest', type: 'REST' },
    { label: 'Rest', type: 'REST' },
  ],
}

const upperLower5x: SplitTemplate = {
  name: 'Upper Lower 5x',
  slug: 'upper-lower-5x',
  daysPerWeek: 5,
  level: 'INTERMEDIATE',
  experienceTags: ['INTERMEDIATE', 'ADVANCED'],
  goal: 'STRENGTH',
  goalTags: ['STRENGTH', 'HYPERTROPHY'],
  description:
    'Five-day upper/lower split combining dedicated strength days with hypertrophy volume days and an accessories finisher. Bridges strength and size programming.',
  dayStructure: ['Upper Strength', 'Lower Strength', 'Rest', 'Upper Hypertrophy', 'Lower Hypertrophy', 'Accessories', 'Rest'],
  days: [
    {
      label: 'Upper Strength',
      type: 'WORKOUT',
      exercises: [
        { name: 'Barbell Bench Press', orderIndex: 0, setsTarget: 5, repRangeMin: 3, repRangeMax: 5 },
        { name: 'Barbell Row', orderIndex: 1, setsTarget: 5, repRangeMin: 3, repRangeMax: 5 },
        { name: 'Barbell Overhead Press', orderIndex: 2, setsTarget: 4, repRangeMin: 4, repRangeMax: 6 },
        { name: 'Pull-Up', orderIndex: 3, setsTarget: 4, repRangeMin: 4, repRangeMax: 6 },
        { name: 'Dumbbell Incline Press', orderIndex: 4, setsTarget: 3, repRangeMin: 6, repRangeMax: 10 },
        { name: 'Cable Row', orderIndex: 5, setsTarget: 3, repRangeMin: 6, repRangeMax: 10 },
        { name: 'Tricep Pushdown', orderIndex: 6, setsTarget: 3, repRangeMin: 8, repRangeMax: 10 },
      ],
    },
    {
      label: 'Lower Strength',
      type: 'WORKOUT',
      exercises: [
        { name: 'Barbell Back Squat', orderIndex: 0, setsTarget: 5, repRangeMin: 3, repRangeMax: 5 },
        { name: 'Conventional Deadlift', orderIndex: 1, setsTarget: 4, repRangeMin: 3, repRangeMax: 5 },
        { name: 'Barbell Front Squat', orderIndex: 2, setsTarget: 3, repRangeMin: 4, repRangeMax: 6 },
        { name: 'Romanian Deadlift', orderIndex: 3, setsTarget: 3, repRangeMin: 5, repRangeMax: 6 },
        { name: 'Leg Press', orderIndex: 4, setsTarget: 3, repRangeMin: 6, repRangeMax: 10 },
        { name: 'Leg Curl', orderIndex: 5, setsTarget: 3, repRangeMin: 8, repRangeMax: 10 },
        { name: 'Calf Raise', orderIndex: 6, setsTarget: 3, repRangeMin: 10, repRangeMax: 15 },
      ],
    },
    { label: 'Rest', type: 'REST' },
    {
      label: 'Upper Hypertrophy',
      type: 'WORKOUT',
      exercises: [
        { name: 'Dumbbell Flat Press', orderIndex: 0, setsTarget: 4, repRangeMin: 8, repRangeMax: 12 },
        { name: 'Chest-Supported Row', orderIndex: 1, setsTarget: 4, repRangeMin: 8, repRangeMax: 12 },
        { name: 'Dumbbell Incline Press', orderIndex: 2, setsTarget: 3, repRangeMin: 10, repRangeMax: 15 },
        { name: 'Wide Grip Lat Pulldown', orderIndex: 3, setsTarget: 3, repRangeMin: 10, repRangeMax: 15 },
        { name: 'Machine Shoulder Press', orderIndex: 4, setsTarget: 3, repRangeMin: 10, repRangeMax: 15 },
        { name: 'Pec Deck', orderIndex: 5, setsTarget: 2, repRangeMin: 12, repRangeMax: 15 },
        { name: 'Dumbbell Lateral Raise', orderIndex: 6, setsTarget: 3, repRangeMin: 15, repRangeMax: 20 },
        { name: 'Incline Dumbbell Curl', orderIndex: 7, setsTarget: 2, repRangeMin: 10, repRangeMax: 15 },
        { name: 'Skull Crusher', orderIndex: 8, setsTarget: 2, repRangeMin: 10, repRangeMax: 15 },
      ],
    },
    {
      label: 'Lower Hypertrophy',
      type: 'WORKOUT',
      exercises: [
        { name: 'Hack Squat', orderIndex: 0, setsTarget: 4, repRangeMin: 8, repRangeMax: 12 },
        { name: 'Hip Thrust', orderIndex: 1, setsTarget: 4, repRangeMin: 8, repRangeMax: 12 },
        { name: 'Bulgarian Split Squat', orderIndex: 2, setsTarget: 3, repRangeMin: 8, repRangeMax: 12 },
        { name: 'Seated Leg Curl', orderIndex: 3, setsTarget: 3, repRangeMin: 10, repRangeMax: 15 },
        { name: 'Leg Extension', orderIndex: 4, setsTarget: 3, repRangeMin: 10, repRangeMax: 15 },
        { name: 'Hip Abduction Machine', orderIndex: 5, setsTarget: 3, repRangeMin: 12, repRangeMax: 20 },
        { name: 'Seated Calf Raise', orderIndex: 6, setsTarget: 3, repRangeMin: 12, repRangeMax: 20 },
      ],
    },
    {
      label: 'Accessories',
      type: 'WORKOUT',
      exercises: [
        { name: 'Preacher Curl', orderIndex: 0, setsTarget: 3, repRangeMin: 10, repRangeMax: 15 },
        { name: 'Cable Hammer Curl', orderIndex: 1, setsTarget: 3, repRangeMin: 12, repRangeMax: 15 },
        { name: 'Cable Rope Pushdown', orderIndex: 2, setsTarget: 3, repRangeMin: 12, repRangeMax: 15 },
        { name: 'Dumbbell Overhead Tricep Extension', orderIndex: 3, setsTarget: 3, repRangeMin: 12, repRangeMax: 15 },
        { name: 'Cable Lateral Raise', orderIndex: 4, setsTarget: 3, repRangeMin: 15, repRangeMax: 20 },
        { name: 'Face Pull', orderIndex: 5, setsTarget: 3, repRangeMin: 15, repRangeMax: 20 },
        { name: 'Single Leg Calf Raise', orderIndex: 6, setsTarget: 3, repRangeMin: 12, repRangeMax: 20 },
        { name: 'Reverse Curl', orderIndex: 7, setsTarget: 2, repRangeMin: 12, repRangeMax: 15 },
      ],
    },
    { label: 'Rest', type: 'REST' },
  ],
}

const ppl3x: SplitTemplate = {
  name: 'PPL 3x',
  slug: 'ppl-3x',
  daysPerWeek: 3,
  level: 'BEGINNER',
  experienceTags: ['BEGINNER'],
  goal: 'HYPERTROPHY',
  goalTags: ['HYPERTROPHY'],
  description:
    'A beginner-friendly push/pull/legs split run once per week. Teaches the PPL movement pattern with manageable session volume before progressing to 6x frequency.',
  dayStructure: ['Push', 'Pull', 'Legs', 'Rest', 'Rest', 'Rest', 'Rest'],
  days: [
    {
      label: 'Push',
      type: 'WORKOUT',
      exercises: [
        { name: 'Barbell Bench Press', orderIndex: 0, setsTarget: 4, repRangeMin: 6, repRangeMax: 10 },
        { name: 'Dumbbell Incline Press', orderIndex: 1, setsTarget: 3, repRangeMin: 8, repRangeMax: 12 },
        { name: 'Dumbbell Shoulder Press', orderIndex: 2, setsTarget: 3, repRangeMin: 8, repRangeMax: 12 },
        { name: 'Cable Fly', orderIndex: 3, setsTarget: 2, repRangeMin: 12, repRangeMax: 15 },
        { name: 'Dumbbell Lateral Raise', orderIndex: 4, setsTarget: 3, repRangeMin: 15, repRangeMax: 20 },
        { name: 'Tricep Pushdown', orderIndex: 5, setsTarget: 3, repRangeMin: 12, repRangeMax: 15 },
        { name: 'Overhead Tricep Extension', orderIndex: 6, setsTarget: 2, repRangeMin: 12, repRangeMax: 15 },
      ],
    },
    {
      label: 'Pull',
      type: 'WORKOUT',
      exercises: [
        { name: 'Barbell Row', orderIndex: 0, setsTarget: 4, repRangeMin: 6, repRangeMax: 10 },
        { name: 'Lat Pulldown', orderIndex: 1, setsTarget: 3, repRangeMin: 8, repRangeMax: 12 },
        { name: 'Cable Row', orderIndex: 2, setsTarget: 3, repRangeMin: 8, repRangeMax: 12 },
        { name: 'Straight Arm Pulldown', orderIndex: 3, setsTarget: 2, repRangeMin: 12, repRangeMax: 15 },
        { name: 'Face Pull', orderIndex: 4, setsTarget: 2, repRangeMin: 15, repRangeMax: 20 },
        { name: 'Barbell Curl', orderIndex: 5, setsTarget: 3, repRangeMin: 10, repRangeMax: 15 },
        { name: 'Hammer Curl', orderIndex: 6, setsTarget: 2, repRangeMin: 10, repRangeMax: 15 },
      ],
    },
    {
      label: 'Legs',
      type: 'WORKOUT',
      exercises: [
        { name: 'Barbell Back Squat', orderIndex: 0, setsTarget: 4, repRangeMin: 6, repRangeMax: 10 },
        { name: 'Romanian Deadlift', orderIndex: 1, setsTarget: 3, repRangeMin: 8, repRangeMax: 12 },
        { name: 'Leg Press', orderIndex: 2, setsTarget: 3, repRangeMin: 8, repRangeMax: 12 },
        { name: 'Leg Curl', orderIndex: 3, setsTarget: 3, repRangeMin: 10, repRangeMax: 15 },
        { name: 'Leg Extension', orderIndex: 4, setsTarget: 3, repRangeMin: 10, repRangeMax: 15 },
        { name: 'Calf Raise', orderIndex: 5, setsTarget: 3, repRangeMin: 12, repRangeMax: 20 },
      ],
    },
    { label: 'Rest', type: 'REST' },
    { label: 'Rest', type: 'REST' },
    { label: 'Rest', type: 'REST' },
    { label: 'Rest', type: 'REST' },
  ],
}

const ppl6x: SplitTemplate = {
  name: 'PPL 6x',
  slug: 'ppl-6x',
  daysPerWeek: 6,
  level: 'INTERMEDIATE',
  experienceTags: ['INTERMEDIATE', 'ADVANCED'],
  goal: 'HYPERTROPHY',
  goalTags: ['HYPERTROPHY'],
  description:
    'Six-day push/pull/legs run twice per week. A and B variants target different angles and movement patterns to maximize weekly volume without repeating identical sessions.',
  dayStructure: ['Push A', 'Pull A', 'Legs A', 'Rest', 'Push B', 'Pull B', 'Legs B'],
  days: [
    {
      label: 'Push A',
      type: 'WORKOUT',
      exercises: [
        { name: 'Barbell Bench Press', orderIndex: 0, setsTarget: 4, repRangeMin: 6, repRangeMax: 10 },
        { name: 'Machine Chest Press', orderIndex: 1, setsTarget: 3, repRangeMin: 8, repRangeMax: 12 },
        { name: 'Dumbbell Shoulder Press', orderIndex: 2, setsTarget: 3, repRangeMin: 8, repRangeMax: 12 },
        { name: 'Cable Fly', orderIndex: 3, setsTarget: 3, repRangeMin: 12, repRangeMax: 15 },
        { name: 'Dumbbell Lateral Raise', orderIndex: 4, setsTarget: 3, repRangeMin: 15, repRangeMax: 20 },
        { name: 'Tricep Pushdown', orderIndex: 5, setsTarget: 3, repRangeMin: 10, repRangeMax: 15 },
        { name: 'Skull Crusher', orderIndex: 6, setsTarget: 2, repRangeMin: 10, repRangeMax: 15 },
      ],
    },
    {
      label: 'Pull A',
      type: 'WORKOUT',
      exercises: [
        { name: 'Barbell Row', orderIndex: 0, setsTarget: 4, repRangeMin: 6, repRangeMax: 10 },
        { name: 'Chest-Supported Row', orderIndex: 1, setsTarget: 3, repRangeMin: 8, repRangeMax: 12 },
        { name: 'Lat Pulldown', orderIndex: 2, setsTarget: 3, repRangeMin: 8, repRangeMax: 12 },
        { name: 'Straight Arm Pulldown', orderIndex: 3, setsTarget: 2, repRangeMin: 12, repRangeMax: 15 },
        { name: 'Face Pull', orderIndex: 4, setsTarget: 2, repRangeMin: 15, repRangeMax: 20 },
        { name: 'Barbell Curl', orderIndex: 5, setsTarget: 3, repRangeMin: 10, repRangeMax: 15 },
        { name: 'Cable Hammer Curl', orderIndex: 6, setsTarget: 2, repRangeMin: 12, repRangeMax: 15 },
      ],
    },
    {
      label: 'Legs A',
      type: 'WORKOUT',
      exercises: [
        { name: 'Barbell Back Squat', orderIndex: 0, setsTarget: 4, repRangeMin: 6, repRangeMax: 10 },
        { name: 'Leg Press', orderIndex: 1, setsTarget: 3, repRangeMin: 8, repRangeMax: 12 },
        { name: 'Bulgarian Split Squat', orderIndex: 2, setsTarget: 3, repRangeMin: 8, repRangeMax: 12 },
        { name: 'Leg Extension', orderIndex: 3, setsTarget: 3, repRangeMin: 10, repRangeMax: 15 },
        { name: 'Leg Curl', orderIndex: 4, setsTarget: 3, repRangeMin: 10, repRangeMax: 15 },
        { name: 'Hip Thrust', orderIndex: 5, setsTarget: 3, repRangeMin: 10, repRangeMax: 15 },
        { name: 'Calf Raise', orderIndex: 6, setsTarget: 3, repRangeMin: 15, repRangeMax: 20 },
      ],
    },
    { label: 'Rest', type: 'REST' },
    {
      label: 'Push B',
      type: 'WORKOUT',
      exercises: [
        { name: 'Barbell Incline Bench Press', orderIndex: 0, setsTarget: 4, repRangeMin: 6, repRangeMax: 10 },
        { name: 'Barbell Overhead Press', orderIndex: 1, setsTarget: 3, repRangeMin: 6, repRangeMax: 10 },
        { name: 'Dumbbell Decline Press', orderIndex: 2, setsTarget: 3, repRangeMin: 8, repRangeMax: 12 },
        { name: 'Cable Incline Fly', orderIndex: 3, setsTarget: 3, repRangeMin: 12, repRangeMax: 15 },
        { name: 'Cable Lateral Raise', orderIndex: 4, setsTarget: 3, repRangeMin: 15, repRangeMax: 20 },
        { name: 'Cable Rope Pushdown', orderIndex: 5, setsTarget: 3, repRangeMin: 12, repRangeMax: 15 },
        { name: 'Dumbbell Overhead Tricep Extension', orderIndex: 6, setsTarget: 2, repRangeMin: 10, repRangeMax: 15 },
      ],
    },
    {
      label: 'Pull B',
      type: 'WORKOUT',
      exercises: [
        { name: 'Pull-Up', orderIndex: 0, setsTarget: 4, repRangeMin: 6, repRangeMax: 10 },
        { name: 'Wide Grip Lat Pulldown', orderIndex: 1, setsTarget: 3, repRangeMin: 8, repRangeMax: 12 },
        { name: 'Cable Row', orderIndex: 2, setsTarget: 3, repRangeMin: 8, repRangeMax: 12 },
        { name: 'Straight Arm Pulldown', orderIndex: 3, setsTarget: 2, repRangeMin: 12, repRangeMax: 15 },
        { name: 'Reverse Fly', orderIndex: 4, setsTarget: 2, repRangeMin: 15, repRangeMax: 20 },
        { name: 'Incline Dumbbell Curl', orderIndex: 5, setsTarget: 3, repRangeMin: 10, repRangeMax: 15 },
        { name: 'Concentration Curl', orderIndex: 6, setsTarget: 2, repRangeMin: 12, repRangeMax: 15 },
      ],
    },
    {
      label: 'Legs B',
      type: 'WORKOUT',
      exercises: [
        { name: 'Conventional Deadlift', orderIndex: 0, setsTarget: 4, repRangeMin: 5, repRangeMax: 8 },
        { name: 'Romanian Deadlift', orderIndex: 1, setsTarget: 3, repRangeMin: 8, repRangeMax: 12 },
        { name: 'Hip Thrust', orderIndex: 2, setsTarget: 3, repRangeMin: 10, repRangeMax: 15 },
        { name: 'Seated Leg Curl', orderIndex: 3, setsTarget: 3, repRangeMin: 10, repRangeMax: 15 },
        { name: 'Walking Lunge', orderIndex: 4, setsTarget: 3, repRangeMin: 10, repRangeMax: 15 },
        { name: 'Hip Abduction Machine', orderIndex: 5, setsTarget: 3, repRangeMin: 15, repRangeMax: 20 },
        { name: 'Seated Calf Raise', orderIndex: 6, setsTarget: 3, repRangeMin: 15, repRangeMax: 20 },
      ],
    },
  ],
}

const pplUpperLowerHybrid: SplitTemplate = {
  name: 'PPL + Upper Lower Hybrid',
  slug: 'ppl-upper-lower-5x',
  daysPerWeek: 5,
  level: 'INTERMEDIATE',
  experienceTags: ['INTERMEDIATE'],
  goal: 'HYPERTROPHY',
  goalTags: ['HYPERTROPHY', 'RECOMPOSITION'],
  description:
    'Hybrid 5-day split combining push/pull/legs with an upper/lower pair. Provides high frequency for upper body while maintaining leg volume through dedicated lower sessions.',
  dayStructure: ['Push', 'Pull', 'Legs', 'Upper', 'Lower', 'Rest', 'Rest'],
  days: [
    {
      label: 'Push',
      type: 'WORKOUT',
      exercises: [
        { name: 'Barbell Bench Press', orderIndex: 0, setsTarget: 4, repRangeMin: 6, repRangeMax: 10 },
        { name: 'Barbell Incline Bench Press', orderIndex: 1, setsTarget: 3, repRangeMin: 8, repRangeMax: 12 },
        { name: 'Dumbbell Shoulder Press', orderIndex: 2, setsTarget: 3, repRangeMin: 8, repRangeMax: 12 },
        { name: 'Cable Fly', orderIndex: 3, setsTarget: 3, repRangeMin: 12, repRangeMax: 15 },
        { name: 'Dumbbell Lateral Raise', orderIndex: 4, setsTarget: 3, repRangeMin: 15, repRangeMax: 20 },
        { name: 'Cable Rope Pushdown', orderIndex: 5, setsTarget: 3, repRangeMin: 12, repRangeMax: 15 },
        { name: 'Tricep Kickback', orderIndex: 6, setsTarget: 2, repRangeMin: 12, repRangeMax: 15 },
      ],
    },
    {
      label: 'Pull',
      type: 'WORKOUT',
      exercises: [
        { name: 'Conventional Deadlift', orderIndex: 0, setsTarget: 4, repRangeMin: 5, repRangeMax: 8 },
        { name: 'Pull-Up', orderIndex: 1, setsTarget: 3, repRangeMin: 6, repRangeMax: 10 },
        { name: 'Dumbbell Row', orderIndex: 2, setsTarget: 3, repRangeMin: 8, repRangeMax: 12 },
        { name: 'Straight Arm Pulldown', orderIndex: 3, setsTarget: 2, repRangeMin: 12, repRangeMax: 15 },
        { name: 'Rear Delt Machine Fly', orderIndex: 4, setsTarget: 2, repRangeMin: 15, repRangeMax: 20 },
        { name: 'Dumbbell Curl', orderIndex: 5, setsTarget: 3, repRangeMin: 10, repRangeMax: 15 },
        { name: 'Preacher Curl', orderIndex: 6, setsTarget: 2, repRangeMin: 10, repRangeMax: 15 },
      ],
    },
    {
      label: 'Legs',
      type: 'WORKOUT',
      exercises: [
        { name: 'Barbell Back Squat', orderIndex: 0, setsTarget: 4, repRangeMin: 6, repRangeMax: 10 },
        { name: 'Romanian Deadlift', orderIndex: 1, setsTarget: 4, repRangeMin: 8, repRangeMax: 12 },
        { name: 'Leg Press', orderIndex: 2, setsTarget: 3, repRangeMin: 8, repRangeMax: 12 },
        { name: 'Leg Curl', orderIndex: 3, setsTarget: 3, repRangeMin: 10, repRangeMax: 15 },
        { name: 'Hip Thrust', orderIndex: 4, setsTarget: 3, repRangeMin: 10, repRangeMax: 15 },
        { name: 'Calf Raise', orderIndex: 5, setsTarget: 3, repRangeMin: 15, repRangeMax: 20 },
      ],
    },
    {
      label: 'Upper',
      type: 'WORKOUT',
      exercises: [
        { name: 'Barbell Overhead Press', orderIndex: 0, setsTarget: 4, repRangeMin: 6, repRangeMax: 10 },
        { name: 'Wide Grip Lat Pulldown', orderIndex: 1, setsTarget: 4, repRangeMin: 8, repRangeMax: 12 },
        { name: 'Dumbbell Flat Press', orderIndex: 2, setsTarget: 3, repRangeMin: 8, repRangeMax: 12 },
        { name: 'Cable Row', orderIndex: 3, setsTarget: 3, repRangeMin: 8, repRangeMax: 12 },
        { name: 'Pec Deck', orderIndex: 4, setsTarget: 2, repRangeMin: 12, repRangeMax: 15 },
        { name: 'Cable Lateral Raise', orderIndex: 5, setsTarget: 2, repRangeMin: 15, repRangeMax: 20 },
        { name: 'Hammer Curl', orderIndex: 6, setsTarget: 2, repRangeMin: 10, repRangeMax: 15 },
        { name: 'Skull Crusher', orderIndex: 7, setsTarget: 2, repRangeMin: 10, repRangeMax: 15 },
      ],
    },
    {
      label: 'Lower',
      type: 'WORKOUT',
      exercises: [
        { name: 'Hack Squat', orderIndex: 0, setsTarget: 4, repRangeMin: 8, repRangeMax: 12 },
        { name: 'Hip Thrust', orderIndex: 1, setsTarget: 4, repRangeMin: 10, repRangeMax: 15 },
        { name: 'Walking Lunge', orderIndex: 2, setsTarget: 3, repRangeMin: 10, repRangeMax: 15 },
        { name: 'Seated Leg Curl', orderIndex: 3, setsTarget: 3, repRangeMin: 10, repRangeMax: 15 },
        { name: 'Hip Abduction Machine', orderIndex: 4, setsTarget: 3, repRangeMin: 12, repRangeMax: 20 },
        { name: 'Seated Calf Raise', orderIndex: 5, setsTarget: 3, repRangeMin: 15, repRangeMax: 20 },
      ],
    },
    { label: 'Rest', type: 'REST' },
    { label: 'Rest', type: 'REST' },
  ],
}

const broSplit5x: SplitTemplate = {
  name: 'Bro Split 5x',
  slug: 'bro-split-5x',
  daysPerWeek: 5,
  level: 'ADVANCED',
  experienceTags: ['INTERMEDIATE', 'ADVANCED'],
  goal: 'HYPERTROPHY',
  goalTags: ['HYPERTROPHY'],
  description:
    'Classic 5-day body-part split with high per-session volume per muscle group. Each muscle trained once per week with maximum isolation and angle variety — best for experienced trainees who can recover from high single-session volume.',
  dayStructure: ['Chest', 'Back', 'Shoulders', 'Legs', 'Arms', 'Rest', 'Rest'],
  days: [
    {
      label: 'Chest',
      type: 'WORKOUT',
      exercises: [
        { name: 'Barbell Bench Press', orderIndex: 0, setsTarget: 4, repRangeMin: 6, repRangeMax: 10 },
        { name: 'Barbell Incline Bench Press', orderIndex: 1, setsTarget: 4, repRangeMin: 8, repRangeMax: 12 },
        { name: 'Dumbbell Decline Press', orderIndex: 2, setsTarget: 3, repRangeMin: 8, repRangeMax: 12 },
        { name: 'Cable Fly', orderIndex: 3, setsTarget: 3, repRangeMin: 12, repRangeMax: 15 },
        { name: 'Cable Incline Fly', orderIndex: 4, setsTarget: 3, repRangeMin: 12, repRangeMax: 15 },
        { name: 'Pec Deck', orderIndex: 5, setsTarget: 3, repRangeMin: 12, repRangeMax: 15 },
        { name: 'Dip', orderIndex: 6, setsTarget: 2, repRangeMin: 10, repRangeMax: 15 },
      ],
    },
    {
      label: 'Back',
      type: 'WORKOUT',
      exercises: [
        { name: 'Conventional Deadlift', orderIndex: 0, setsTarget: 4, repRangeMin: 5, repRangeMax: 8 },
        { name: 'Barbell Row', orderIndex: 1, setsTarget: 4, repRangeMin: 6, repRangeMax: 10 },
        { name: 'Pull-Up', orderIndex: 2, setsTarget: 3, repRangeMin: 6, repRangeMax: 10 },
        { name: 'Dumbbell Row', orderIndex: 3, setsTarget: 3, repRangeMin: 8, repRangeMax: 12 },
        { name: 'Wide Grip Lat Pulldown', orderIndex: 4, setsTarget: 3, repRangeMin: 8, repRangeMax: 12 },
        { name: 'Straight Arm Pulldown', orderIndex: 5, setsTarget: 2, repRangeMin: 12, repRangeMax: 15 },
        { name: 'Machine Row', orderIndex: 6, setsTarget: 2, repRangeMin: 12, repRangeMax: 15 },
      ],
    },
    {
      label: 'Shoulders',
      type: 'WORKOUT',
      exercises: [
        { name: 'Barbell Overhead Press', orderIndex: 0, setsTarget: 4, repRangeMin: 6, repRangeMax: 10 },
        { name: 'Arnold Press', orderIndex: 1, setsTarget: 3, repRangeMin: 8, repRangeMax: 12 },
        { name: 'Dumbbell Lateral Raise', orderIndex: 2, setsTarget: 4, repRangeMin: 12, repRangeMax: 20 },
        { name: 'Cable Lateral Raise', orderIndex: 3, setsTarget: 3, repRangeMin: 15, repRangeMax: 20 },
        { name: 'Face Pull', orderIndex: 4, setsTarget: 3, repRangeMin: 15, repRangeMax: 20 },
        { name: 'Reverse Fly', orderIndex: 5, setsTarget: 3, repRangeMin: 15, repRangeMax: 20 },
        { name: 'Rear Delt Machine Fly', orderIndex: 6, setsTarget: 2, repRangeMin: 15, repRangeMax: 20 },
      ],
    },
    {
      label: 'Legs',
      type: 'WORKOUT',
      exercises: [
        { name: 'Barbell Back Squat', orderIndex: 0, setsTarget: 4, repRangeMin: 6, repRangeMax: 10 },
        { name: 'Romanian Deadlift', orderIndex: 1, setsTarget: 4, repRangeMin: 8, repRangeMax: 12 },
        { name: 'Leg Press', orderIndex: 2, setsTarget: 4, repRangeMin: 8, repRangeMax: 12 },
        { name: 'Hip Thrust', orderIndex: 3, setsTarget: 3, repRangeMin: 10, repRangeMax: 15 },
        { name: 'Leg Extension', orderIndex: 4, setsTarget: 3, repRangeMin: 10, repRangeMax: 15 },
        { name: 'Seated Leg Curl', orderIndex: 5, setsTarget: 3, repRangeMin: 10, repRangeMax: 15 },
        { name: 'Calf Raise', orderIndex: 6, setsTarget: 4, repRangeMin: 12, repRangeMax: 20 },
      ],
    },
    {
      label: 'Arms',
      type: 'WORKOUT',
      exercises: [
        { name: 'Barbell Curl', orderIndex: 0, setsTarget: 4, repRangeMin: 8, repRangeMax: 12 },
        { name: 'Skull Crusher', orderIndex: 1, setsTarget: 4, repRangeMin: 8, repRangeMax: 12 },
        { name: 'Incline Dumbbell Curl', orderIndex: 2, setsTarget: 3, repRangeMin: 10, repRangeMax: 15 },
        { name: 'Overhead Tricep Extension', orderIndex: 3, setsTarget: 3, repRangeMin: 10, repRangeMax: 15 },
        { name: 'Preacher Curl', orderIndex: 4, setsTarget: 3, repRangeMin: 10, repRangeMax: 15 },
        { name: 'Cable Rope Pushdown', orderIndex: 5, setsTarget: 3, repRangeMin: 12, repRangeMax: 15 },
        { name: 'Concentration Curl', orderIndex: 6, setsTarget: 2, repRangeMin: 12, repRangeMax: 15 },
        { name: 'Diamond Push-Up', orderIndex: 7, setsTarget: 2, repRangeMin: 10, repRangeMax: 15 },
      ],
    },
    { label: 'Rest', type: 'REST' },
    { label: 'Rest', type: 'REST' },
  ],
}

const strength4x: SplitTemplate = {
  name: 'Strength 4x',
  slug: 'strength-4x',
  daysPerWeek: 4,
  level: 'INTERMEDIATE',
  experienceTags: ['INTERMEDIATE', 'ADVANCED'],
  goal: 'STRENGTH',
  goalTags: ['STRENGTH'],
  description:
    'Four-day upper/lower split with dedicated strength days followed by volume days. Primary goal is progressive overload on the big lifts; volume days reinforce hypertrophy and movement quality.',
  dayStructure: ['Upper Strength', 'Lower Strength', 'Rest', 'Upper Volume', 'Lower Volume', 'Rest', 'Rest'],
  days: [
    {
      label: 'Upper Strength',
      type: 'WORKOUT',
      exercises: [
        { name: 'Barbell Bench Press', orderIndex: 0, setsTarget: 5, repRangeMin: 3, repRangeMax: 5 },
        { name: 'Barbell Row', orderIndex: 1, setsTarget: 5, repRangeMin: 3, repRangeMax: 5 },
        { name: 'Barbell Overhead Press', orderIndex: 2, setsTarget: 4, repRangeMin: 4, repRangeMax: 6 },
        { name: 'Pull-Up', orderIndex: 3, setsTarget: 4, repRangeMin: 4, repRangeMax: 6 },
        { name: 'Close Grip Bench Press', orderIndex: 4, setsTarget: 3, repRangeMin: 6, repRangeMax: 10 },
        { name: 'Cable Row', orderIndex: 5, setsTarget: 3, repRangeMin: 6, repRangeMax: 10 },
        { name: 'Tricep Pushdown', orderIndex: 6, setsTarget: 3, repRangeMin: 8, repRangeMax: 10 },
      ],
    },
    {
      label: 'Lower Strength',
      type: 'WORKOUT',
      exercises: [
        { name: 'Barbell Back Squat', orderIndex: 0, setsTarget: 5, repRangeMin: 3, repRangeMax: 5 },
        { name: 'Conventional Deadlift', orderIndex: 1, setsTarget: 5, repRangeMin: 2, repRangeMax: 4 },
        { name: 'Barbell Front Squat', orderIndex: 2, setsTarget: 3, repRangeMin: 4, repRangeMax: 6 },
        { name: 'Romanian Deadlift', orderIndex: 3, setsTarget: 3, repRangeMin: 4, repRangeMax: 6 },
        { name: 'Leg Press', orderIndex: 4, setsTarget: 3, repRangeMin: 6, repRangeMax: 10 },
        { name: 'Good Morning', orderIndex: 5, setsTarget: 3, repRangeMin: 6, repRangeMax: 10 },
        { name: 'Calf Raise', orderIndex: 6, setsTarget: 3, repRangeMin: 10, repRangeMax: 15 },
      ],
    },
    { label: 'Rest', type: 'REST' },
    {
      label: 'Upper Volume',
      type: 'WORKOUT',
      exercises: [
        { name: 'Dumbbell Incline Press', orderIndex: 0, setsTarget: 4, repRangeMin: 8, repRangeMax: 12 },
        { name: 'Chest-Supported Row', orderIndex: 1, setsTarget: 4, repRangeMin: 8, repRangeMax: 12 },
        { name: 'Machine Shoulder Press', orderIndex: 2, setsTarget: 3, repRangeMin: 10, repRangeMax: 15 },
        { name: 'Wide Grip Lat Pulldown', orderIndex: 3, setsTarget: 3, repRangeMin: 10, repRangeMax: 15 },
        { name: 'Cable Fly', orderIndex: 4, setsTarget: 3, repRangeMin: 12, repRangeMax: 15 },
        { name: 'Face Pull', orderIndex: 5, setsTarget: 2, repRangeMin: 15, repRangeMax: 20 },
        { name: 'Barbell Curl', orderIndex: 6, setsTarget: 3, repRangeMin: 10, repRangeMax: 15 },
        { name: 'Overhead Tricep Extension', orderIndex: 7, setsTarget: 3, repRangeMin: 10, repRangeMax: 15 },
      ],
    },
    {
      label: 'Lower Volume',
      type: 'WORKOUT',
      exercises: [
        { name: 'Hack Squat', orderIndex: 0, setsTarget: 4, repRangeMin: 8, repRangeMax: 12 },
        { name: 'Hip Thrust', orderIndex: 1, setsTarget: 4, repRangeMin: 10, repRangeMax: 15 },
        { name: 'Bulgarian Split Squat', orderIndex: 2, setsTarget: 3, repRangeMin: 8, repRangeMax: 12 },
        { name: 'Nordic Hamstring Curl', orderIndex: 3, setsTarget: 3, repRangeMin: 6, repRangeMax: 10 },
        { name: 'Leg Extension', orderIndex: 4, setsTarget: 3, repRangeMin: 10, repRangeMax: 15 },
        { name: 'Hip Abduction Machine', orderIndex: 5, setsTarget: 3, repRangeMin: 12, repRangeMax: 20 },
        { name: 'Seated Calf Raise', orderIndex: 6, setsTarget: 3, repRangeMin: 15, repRangeMax: 20 },
      ],
    },
    { label: 'Rest', type: 'REST' },
    { label: 'Rest', type: 'REST' },
  ],
}

const highFrequency6x: SplitTemplate = {
  name: 'High Frequency 6x',
  slug: 'high-frequency-6x',
  daysPerWeek: 6,
  level: 'ADVANCED',
  experienceTags: ['ADVANCED'],
  goal: 'HYPERTROPHY',
  goalTags: ['HYPERTROPHY'],
  description:
    'Six-day high-frequency split targeting every major group multiple times per week via an Upper/Lower/Push/Pull/Legs/Arms+Delts structure. Designed for advanced trainees who can handle and recover from dense weekly volume.',
  dayStructure: ['Upper A', 'Lower A', 'Push', 'Pull', 'Legs', 'Arms + Delts', 'Rest'],
  days: [
    {
      label: 'Upper A',
      type: 'WORKOUT',
      exercises: [
        { name: 'Barbell Bench Press', orderIndex: 0, setsTarget: 4, repRangeMin: 6, repRangeMax: 10 },
        { name: 'Barbell Row', orderIndex: 1, setsTarget: 4, repRangeMin: 6, repRangeMax: 10 },
        { name: 'Barbell Overhead Press', orderIndex: 2, setsTarget: 3, repRangeMin: 6, repRangeMax: 10 },
        { name: 'Lat Pulldown', orderIndex: 3, setsTarget: 3, repRangeMin: 8, repRangeMax: 12 },
        { name: 'Dumbbell Incline Press', orderIndex: 4, setsTarget: 3, repRangeMin: 8, repRangeMax: 12 },
        { name: 'Cable Row', orderIndex: 5, setsTarget: 3, repRangeMin: 10, repRangeMax: 15 },
        { name: 'Face Pull', orderIndex: 6, setsTarget: 2, repRangeMin: 15, repRangeMax: 20 },
        { name: 'Dumbbell Curl', orderIndex: 7, setsTarget: 2, repRangeMin: 10, repRangeMax: 15 },
        { name: 'Tricep Pushdown', orderIndex: 8, setsTarget: 2, repRangeMin: 10, repRangeMax: 15 },
      ],
    },
    {
      label: 'Lower A',
      type: 'WORKOUT',
      exercises: [
        { name: 'Barbell Back Squat', orderIndex: 0, setsTarget: 4, repRangeMin: 6, repRangeMax: 10 },
        { name: 'Romanian Deadlift', orderIndex: 1, setsTarget: 4, repRangeMin: 8, repRangeMax: 12 },
        { name: 'Leg Press', orderIndex: 2, setsTarget: 3, repRangeMin: 8, repRangeMax: 12 },
        { name: 'Hip Thrust', orderIndex: 3, setsTarget: 3, repRangeMin: 10, repRangeMax: 15 },
        { name: 'Leg Curl', orderIndex: 4, setsTarget: 3, repRangeMin: 10, repRangeMax: 15 },
        { name: 'Leg Extension', orderIndex: 5, setsTarget: 3, repRangeMin: 10, repRangeMax: 15 },
        { name: 'Calf Raise', orderIndex: 6, setsTarget: 3, repRangeMin: 15, repRangeMax: 20 },
      ],
    },
    {
      label: 'Push',
      type: 'WORKOUT',
      exercises: [
        { name: 'Barbell Incline Bench Press', orderIndex: 0, setsTarget: 4, repRangeMin: 6, repRangeMax: 10 },
        { name: 'Machine Incline Press', orderIndex: 1, setsTarget: 3, repRangeMin: 8, repRangeMax: 12 },
        { name: 'Arnold Press', orderIndex: 2, setsTarget: 3, repRangeMin: 8, repRangeMax: 12 },
        { name: 'Cable Incline Fly', orderIndex: 3, setsTarget: 3, repRangeMin: 12, repRangeMax: 15 },
        { name: 'Cable Lateral Raise', orderIndex: 4, setsTarget: 3, repRangeMin: 15, repRangeMax: 20 },
        { name: 'Skull Crusher', orderIndex: 5, setsTarget: 3, repRangeMin: 10, repRangeMax: 15 },
        { name: 'Cable Rope Pushdown', orderIndex: 6, setsTarget: 2, repRangeMin: 12, repRangeMax: 15 },
      ],
    },
    {
      label: 'Pull',
      type: 'WORKOUT',
      exercises: [
        { name: 'Conventional Deadlift', orderIndex: 0, setsTarget: 4, repRangeMin: 5, repRangeMax: 8 },
        { name: 'Pull-Up', orderIndex: 1, setsTarget: 3, repRangeMin: 6, repRangeMax: 10 },
        { name: 'Chest-Supported Row', orderIndex: 2, setsTarget: 3, repRangeMin: 8, repRangeMax: 12 },
        { name: 'Wide Grip Lat Pulldown', orderIndex: 3, setsTarget: 3, repRangeMin: 8, repRangeMax: 12 },
        { name: 'Straight Arm Pulldown', orderIndex: 4, setsTarget: 2, repRangeMin: 12, repRangeMax: 15 },
        { name: 'Reverse Fly', orderIndex: 5, setsTarget: 2, repRangeMin: 15, repRangeMax: 20 },
        { name: 'Incline Dumbbell Curl', orderIndex: 6, setsTarget: 3, repRangeMin: 10, repRangeMax: 15 },
        { name: 'Cable Rope Curl', orderIndex: 7, setsTarget: 2, repRangeMin: 12, repRangeMax: 15 },
      ],
    },
    {
      label: 'Legs',
      type: 'WORKOUT',
      exercises: [
        { name: 'Sumo Deadlift', orderIndex: 0, setsTarget: 4, repRangeMin: 5, repRangeMax: 8 },
        { name: 'Hack Squat', orderIndex: 1, setsTarget: 4, repRangeMin: 8, repRangeMax: 12 },
        { name: 'Bulgarian Split Squat', orderIndex: 2, setsTarget: 3, repRangeMin: 8, repRangeMax: 12 },
        { name: 'Seated Leg Curl', orderIndex: 3, setsTarget: 3, repRangeMin: 10, repRangeMax: 15 },
        { name: 'Hip Abduction Machine', orderIndex: 4, setsTarget: 3, repRangeMin: 12, repRangeMax: 20 },
        { name: 'Smith Machine Hip Thrust', orderIndex: 5, setsTarget: 3, repRangeMin: 10, repRangeMax: 15 },
        { name: 'Donkey Calf Raise', orderIndex: 6, setsTarget: 3, repRangeMin: 15, repRangeMax: 20 },
      ],
    },
    {
      label: 'Arms + Delts',
      type: 'WORKOUT',
      exercises: [
        { name: 'Spider Curl', orderIndex: 0, setsTarget: 3, repRangeMin: 10, repRangeMax: 15 },
        { name: 'Cable Curl', orderIndex: 1, setsTarget: 3, repRangeMin: 12, repRangeMax: 15 },
        { name: 'Machine Curl', orderIndex: 2, setsTarget: 2, repRangeMin: 12, repRangeMax: 15 },
        { name: 'Machine Tricep Press', orderIndex: 3, setsTarget: 3, repRangeMin: 10, repRangeMax: 15 },
        { name: 'Dumbbell Overhead Tricep Extension', orderIndex: 4, setsTarget: 3, repRangeMin: 12, repRangeMax: 15 },
        { name: 'Machine Lateral Raise', orderIndex: 5, setsTarget: 3, repRangeMin: 15, repRangeMax: 20 },
        { name: 'Rear Delt Machine Fly', orderIndex: 6, setsTarget: 3, repRangeMin: 15, repRangeMax: 20 },
        { name: 'Seated Calf Raise', orderIndex: 7, setsTarget: 3, repRangeMin: 15, repRangeMax: 20 },
      ],
    },
    { label: 'Rest', type: 'REST' },
  ],
}

export const splitTemplates: SplitTemplate[] = [
  fullBody3x,
  fullBody4x,
  upperLower4x,
  upperLower5x,
  ppl3x,
  ppl6x,
  pplUpperLowerHybrid,
  broSplit5x,
  strength4x,
  highFrequency6x,
]
