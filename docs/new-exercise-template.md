# New Exercise Questionnaire (Simple Version)

Use this form when adding one new exercise to `prisma/seed.ts`.

Fill this in first, then copy values into the seed entry.

---

## 1) Basic Information

### Q1. What is the exercise name?
- **Schema field:** `name`
- **Required:** Yes (must be unique)
- **Answer:** `____________________________`

### Q2. What is the main muscle this exercise targets?
- **Schema field:** `primaryMuscle`
- **Required:** Yes
- **Accepted values:** Free text used in this project (examples: `CHEST`, `BACK`, `QUADS`)
- **Answer:** `____________________________`

### Q3. What other muscles are involved?
- **Schema field:** `secondaryMuscles`
- **Required:** Yes (can be empty array)
- **Accepted values:** List of strings
- **Answer:** `____________________________`

### Q4. What movement pattern best describes this exercise?
- **Schema field:** `movementPattern`
- **Required:** Yes
- **Accepted values:** Free text used in this project (examples: `SQUAT`, `HINGE`, `HORIZONTAL_PUSH`, `ISOLATION`)
- **Answer:** `____________________________`

### Q5. Which category should the progression engine use?
- **Schema field:** `category`
- **Required:** Yes
- **Accepted values (enum):**
  - `PRIMARY_COMPOUND`
  - `COMPOUND_ACCESSORY`
  - `ISOLATION_PRIMARY`
  - `ISOLATION_AUXILIARY`
- **Answer:** `____________________________`

### Q6. Is this a compound or isolation exercise type?
- **Schema field:** `exerciseType`
- **Required:** Yes
- **Accepted values:** Project strings (typically `COMPOUND` or `ISOLATION`)
- **Answer:** `____________________________`

### Q7. Is it compound?
- **Schema field:** `isCompound`
- **Required:** Yes
- **Accepted values:** `true` or `false`
- **Answer:** `____________________________`

---

## 2) Fatigue Profile

### Q8. Base fatigue score for this exercise?
- **Schema field:** `fatigueScore`
- **Required:** Yes
- **Accepted values:** Number (`Float`)
- **What it affects:** Base fatigue cost
- **Answer:** `____________________________`

### Q9. Stability demand value?
- **Schema field:** `stabilityDemand`
- **Required:** Yes
- **Accepted values:** Number (`Float`)
- **What it affects:** Stability part of fatigue cost
- **Answer:** `____________________________`

### Q10. Method fatigue multiplier?
- **Schema field:** `methodFatigueMultiplier`
- **Required:** Yes
- **Accepted values:** Number (`Float`)
- **What it affects:** Final multiplier in fatigue cost
- **Answer:** `____________________________`

---

## 3) Equipment

### Q11. Which equipment profile should this exercise use?
- **Schema field:** `equipmentProfileId`
- **Required:** Yes
- **Accepted values:** Existing equipment profile ID
- **Answer:** `____________________________`

If creating a new equipment profile, also fill:

### Q12. Equipment profile name?
- **Schema field:** `name` (on `EquipmentProfile`)
- **Required:** Yes (if new profile)
- **Accepted values:** String (examples: `BARBELL`, `DUMBBELL`, `CABLE`, `BODYWEIGHT`, `MACHINE`)
- **Answer:** `____________________________`

### Q13. Required equipment list?
- **Schema field:** `requiredEquipment`
- **Required:** Yes (if new profile)
- **Accepted values:** List of strings
- **Answer:** `____________________________`

---

## 4) Substitution (Optional but Recommended)

### Q14. Which substitution pool should include this exercise?
- **Schema field:** `poolId`
- **Required:** Optional
- **Accepted values:** Existing substitution pool ID
- **Answer:** `____________________________`

If creating a new substitution pool, also fill:

### Q15. New substitution pool name?
- **Schema field:** `name` (on `SubstitutionPool`)
- **Required:** Yes (if new pool)
- **Accepted values:** String
- **Answer:** `____________________________`

### Q16. Pool primary muscle?
- **Schema field:** `primaryMuscle` (on `SubstitutionPool`)
- **Required:** Yes (if new pool)
- **Accepted values:** String
- **Answer:** `____________________________`

### Q17. Pool movement pattern?
- **Schema field:** `movementPattern` (on `SubstitutionPool`)
- **Required:** Yes (if new pool)
- **Accepted values:** String
- **Answer:** `____________________________`

For pool membership:

### Q18. Priority inside this pool?
- **Schema field:** `priority` (on `SubstitutionPoolExercise`)
- **Required:** Yes (if adding to pool)
- **Accepted values:** Integer
- **Answer:** `____________________________`

### Q19. Which pain flags is this suitable for?
- **Schema field:** `suitableWhenPain`
- **Required:** Yes (if adding to pool; can be empty list)
- **Accepted values:** List of strings (joint/pain tags)
- **Answer:** `____________________________`

---

## 5) Execution Profile

### Q20. Which execution profile should this exercise use?
- **Schema field:** `executionProfileId`
- **Required:** Yes
- **Accepted values:** Existing execution profile ID
- **Answer:** `____________________________`

If creating a new execution profile, also fill:

### Q21. Execution zone?
- **Schema field:** `zone`
- **Required:** Yes (if new profile)
- **Accepted values:** String (existing examples: `CONTROLLED`, `HYPERTROPHY`, `PERFORMANCE`)
- **Answer:** `____________________________`

### Q22. Execution description?
- **Schema field:** `description` (on `ExecutionProfile`)
- **Required:** Yes (if new profile)
- **Accepted values:** String
- **Answer:** `____________________________`

### Q23. RPE range?
- **Schema field:** `rpeRange`
- **Required:** Yes (if new profile)
- **Accepted values:** String (examples: `6-8`, `7-9`, `8-10`)
- **Answer:** `____________________________`

### Q24. Execution multiplier?
- **Schema field:** `multiplier`
- **Required:** Yes (if new profile)
- **Accepted values:** Number (`Float`)
- **Answer:** `____________________________`

---

## 6) Auto/Linking Fields (Do Not Manually Set in Normal Seed Flow)

- `id` fields on `Exercise`, `ExerciseMetadata`, and join rows are auto-generated.
- `exerciseId` in `ExerciseMetadata` is set automatically from the created/upserted exercise (`exercise.id`).

---

## Seed Entry Preview

```ts
// TODO: ensure equipment profile exists (or create it first)
const equipmentProfile = await prisma.equipmentProfile.upsert({
  where: { name: 'TODO_EQUIPMENT_PROFILE_NAME' },
  update: {},
  create: {
    name: 'TODO_EQUIPMENT_PROFILE_NAME',
    requiredEquipment: ['TODO_REQUIRED_EQUIPMENT_1'],
  },
})

// TODO: ensure execution profile exists (or create it first)
const executionProfile = await prisma.executionProfile.upsert({
  where: { zone: 'TODO_EXECUTION_ZONE' },
  update: {},
  create: {
    zone: 'TODO_EXECUTION_ZONE',
    description: 'TODO_EXECUTION_DESCRIPTION',
    rpeRange: 'TODO_RPE_RANGE',
    multiplier: 1.0, // TODO
  },
})

const exercise = await prisma.exercise.upsert({
  where: { name: 'TODO_EXERCISE_NAME' },
  update: {},
  create: {
    name: 'TODO_EXERCISE_NAME',
    category: 'TODO_CATEGORY', // PRIMARY_COMPOUND | COMPOUND_ACCESSORY | ISOLATION_PRIMARY | ISOLATION_AUXILIARY
    primaryMuscle: 'TODO_PRIMARY_MUSCLE',
    secondaryMuscles: ['TODO_SECONDARY_MUSCLE_1'],
    movementPattern: 'TODO_MOVEMENT_PATTERN',
    exerciseType: 'TODO_EXERCISE_TYPE',
    isCompound: true, // TODO
  },
})

await prisma.exerciseMetadata.upsert({
  where: { exerciseId: exercise.id },
  update: {},
  create: {
    exerciseId: exercise.id,
    fatigueScore: 0, // TODO
    stabilityDemand: 0, // TODO
    methodFatigueMultiplier: 0, // TODO
    equipmentProfileId: equipmentProfile.id,
    executionProfileId: executionProfile.id,
  },
})

// Optional: add to one or more substitution pools
const substitutionPool = await prisma.substitutionPool.upsert({
  where: { name: 'TODO_SUBSTITUTION_POOL_NAME' },
  update: {},
  create: {
    name: 'TODO_SUBSTITUTION_POOL_NAME',
    primaryMuscle: 'TODO_POOL_PRIMARY_MUSCLE',
    movementPattern: 'TODO_POOL_MOVEMENT_PATTERN',
  },
})

await prisma.substitutionPoolExercise.upsert({
  where: {
    poolId_exerciseId: {
      poolId: substitutionPool.id,
      exerciseId: exercise.id,
    },
  },
  update: {},
  create: {
    poolId: substitutionPool.id,
    exerciseId: exercise.id,
    priority: 1, // TODO
    suitableWhenPain: ['TODO_JOINT_FLAG'],
  },
})
```
