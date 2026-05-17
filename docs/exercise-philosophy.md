# Exercise Philosophy & Classification Reference

## Purpose

This document defines what exercises are in Kinetiq: not a flat database of movements, but a relational ecosystem where each exercise has hierarchical identity, movement relationships, fatigue signatures, substitution logic, and recovery implications. It is the authoritative reference for adding new exercises and for understanding how exercise intelligence feeds the adaptive coaching engine.

The system is not anatomy-centric. It is movement-centric, fatigue-centric, and adaptation-centric. Two exercises targeting the same muscle can carry fundamentally different fatigue costs, joint stress profiles, and stimulus characteristics, and the engine must treat them differently to preserve productive overload while controlling recovery risk.

## The Four-Layer Architecture Context

Exercise intelligence is Layer 2 of a four-layer system:

- Layer 1 — Mesocycle Logic: governs how much stress the athlete receives (fatigue accumulation, progression, deloads, volume escalation).
- Layer 2 — Exercise Ontology (this layer): governs what kind of stress is applied (movement identity, fatigue profile, substitution logic, joint stress, recovery implications).
- Layer 3 — Split Architecture: governs where stress goes (movement category distribution, weekly fatigue balance, muscle grouping).
- Layer 4 — Adaptive Coaching Engine: governs how the system reacts (exercise swapping, volume modification, recovery-driven substitution).

This document covers Layer 2 only; the other layers belong to separate reference documents.

## The Multi-Dimensional Exercise Identity

Every exercise in Kinetiq exists simultaneously across multiple classification dimensions. Barbell Row is a worked example:

- Movement Category: Horizontal Pull / Hip Hinge Stabilized Pull
- Primary Muscle: Back (rhomboids, traps, lats)
- Secondary Muscles: Biceps, Rear Delt, Erectors
- Fatigue Category: High systemic fatigue, Moderate local fatigue
- Equipment: Barbell / Free Weight
- Stability Demand: High (1.2 multiplier)
- Joint Stress: Lower back stress, moderate elbow flexor stress
- Goal Bias: Hypertrophy and Strength
- Recovery Demand: High (requires 48-72hr before same movement class) (design intent — aligns with 48hr biofeedback offset architecture)
- Programming Role: Midback thickness / Compound row slot
- Substitution Pool: Chest-supported row, Machine row, Cable row, T-bar row [NEEDS VERIFICATION]

This is how an advanced coach reasons about exercise selection. The engine must reason the same way.

## Classification Dimensions

### 1. MovementPattern (7 values)

- `HORIZONTAL_PUSH` — Force is produced away from the torso along a mostly horizontal line, dominated by pressing mechanics.
- `VERTICAL_PUSH` — Force is produced upward relative to torso orientation, emphasizing overhead pressing mechanics.
- `HORIZONTAL_PULL` — The upper limb travels toward the torso in a horizontal pulling path, biasing scapular retraction and midback work.
- `VERTICAL_PULL` — The upper limb travels from overhead toward the torso, biasing shoulder adduction/extension in a vertical pull.
- `SQUAT` — Knee- and hip-dominant lower-body pattern with a squat-style center-of-mass path.
- `HINGE` — Hip-dominant lower-body pattern with posterior-chain loading and reduced knee excursion relative to squats.
- `ISOLATION` — Catch-all for single-joint, single-plane, low-complexity movements.

### 2. MovementClass

MovementClass is the sub-classification beneath MovementPattern. It describes the specific biomechanical stimulus, not just movement direction. This is the most important classification dimension in the system.

Why it matters: two exercises can share a broad movement direction but produce fundamentally different fatigue and stimulus profiles. Example: Barbell Row and Conventional Deadlift both load the posterior chain, but one is primarily a midback thickness row class while the other is axial hinge systemic loading. The engine should reason by MovementClass, not MovementPattern alone.

**Back — 4 Movement Classes**

These four classes reflect functional coaching logic instead of anatomy labels alone:

- `BACK_STRAIGHT_ARM_PULL` — Shoulder extension with fixed elbow, isolating lats with minimal elbow flexor contribution and relatively low systemic cost.
- `BACK_VERTICAL_PULL` — Elbow tracks from overhead toward torso, biasing lats/teres major with meaningful elbow flexor contribution and moderate systemic demand.
- `BACK_HORIZONTAL_PULL` — Elbow tracks toward torso from horizontal, biasing rhomboids/traps/midback with spinal demand varying by variation.
- `BACK_AXIAL_HINGE` — Erector-dominant axial loading pattern with very high systemic fatigue and deadlift-style global stress.

**Chest**
- `CHEST_HORIZONTAL_PRESS` — Midrange horizontal pressing pattern for broad pec loading with triceps/front-delt support.
- `CHEST_INCLINE_PRESS` — Pressing path shifts toward clavicular fibers and anterior shoulder contribution.
- `CHEST_ADDUCTION_FLY` — Horizontal adduction-focused chest isolation with reduced pressing synergy.
Reserved — exercises pending: `CHEST_STRETCH_BIASED`

**Shoulders**
- `SHOULDER_VERTICAL_PRESS` — Multi-joint overhead pressing with high front-delt and triceps integration.
- `SHOULDER_LATERAL_ABDUCTION` — Side-delt isolation through abduction with minimal pressing carryover.
- `SHOULDER_REAR_DELT` — Rear-delt and scapular stabilizer bias through transverse extension/retraction work.
Reserved — exercises pending: `SHOULDER_LENGTHENED`

**Glutes**
- `GLUTE_HIP_THRUST` — Hip-thrust bridge family with peak glute contraction near short muscle lengths.
- `GLUTE_HIP_ABDUCTION` — Frontal-plane glute med/min bias for pelvic control and abduction capacity.
- `GLUTE_KICKBACK` — Hip extension isolation with low axial loading and localized glute targeting.
Reserved — exercises pending: `GLUTE_HIP_HINGE`, `GLUTE_SQUAT`

**Hamstrings**
- `HAMSTRING_HIP_HINGE` — Lengthened hip-hinge hamstring loading integrated with glute/erector support.
- `HAMSTRING_KNEE_FLEXION` — Knee-flexion dominant hamstring targeting with lower systemic load than heavy hinges.
Reserved — exercises pending: `HAMSTRING_UNILATERAL`, `HAMSTRING_LENGTHENED`

**Quads**
- `QUAD_BILATERAL_SQUAT` — Bilateral squat mechanics for high total quad loading with substantial systemic demand.
- `QUAD_MACHINE_PRESS` — Machine-guided squat/press quad loading with reduced stabilization overhead.
- `QUAD_UNILATERAL` — Single-leg squat/lunge family with high per-limb stimulus and stability demand.
- `QUAD_KNEE_EXTENSION` — Open-chain knee extension isolation for direct quad loading with low systemic fatigue.

**Biceps**
- `BICEP_SUPINATED_CURL` — Supinated elbow-flexion pattern maximizing classic biceps brachii contribution.
- `BICEP_LENGTHENED` — Curl setup biased toward loaded stretch and long-length tension.
- `BICEP_SHORTENED` — Curl setup biased toward peak contraction/shortened-position loading.
- `BICEP_NEUTRAL_BRACHIALIS` — Neutral/pronated-biased elbow flexion shifting emphasis toward brachialis/brachioradialis.

**Triceps**
- `TRICEP_PRESS_COMPOUND` — Press-dominant tricep loading integrated with chest/shoulder compounds.
- `TRICEP_PUSHDOWN` — Elbow extension with shoulder in neutral/flexed-low positions for midrange tricep loading.
- `TRICEP_OVERHEAD_EXTENSION` — Elbow extension with shoulder flexion biasing long-head lengthened demands.
Reserved — exercises pending: `TRICEP_LENGTHENED`

**Calves**
- `CALF_STANDING` — Standing plantar-flexion biasing gastrocnemius-dominant mechanics.
- `CALF_SEATED` — Seated plantar-flexion with increased soleus bias due to knee flexion.
- `CALF_UNILATERAL` — Single-leg calf loading with higher per-limb stability and coordination demand.
Reserved — exercises pending: `CALF_STRETCH_BIASED`

Core — 0 exercises currently seeded. Six MovementClass values are defined and ready: `CORE_SPINAL_FLEXION`, `CORE_ANTI_EXTENSION`, `CORE_ANTI_ROTATION`, `CORE_ROTATION`, `CORE_HIP_FLEXION`, `CORE_LOADED_CARRY`. These follow the same biomechanical-category logic as all other groups.

### 3. ExerciseCategory (4 values)

- `PRIMARY_COMPOUND` — Session anchor lift for highest stimulus and systemic load; typically placed first in the session.
- `COMPOUND_ACCESSORY` — Secondary multi-joint builder supporting the main pattern with slightly lower absolute demand; usually early-mid session.
- `ISOLATION_PRIMARY` — Direct single-joint hypertrophy work for key target tissues after compounds; usually mid-late session.
- `ISOLATION_AUXILIARY` — Low-systemic finishing work for local tissue quality, pump, or weak-point cleanup; typically last in session order.

### 4. Fatigue Metadata

`fatigueScore` (Float): base systemic cost before multipliers. Current seed values run approximately 3-10, with higher values driven by axial loading, full-body demand, and large bilateral compounds; lower values appear in machine isolation and constrained single-joint work. Anchor reference: Conventional Deadlift = 10, machine isolations around 3-4.

`stabilityDemand` (Float): multiplier for stabilization overhead (neurological and positional demands while executing the lift). Current seed values are approximately 1.0-1.4, with free weights generally higher than machines and many unilateral patterns carrying high per-limb stability cost even at lower external loads.

`methodFatigueMultiplier` (Float): reserved modifier for advanced set methods that amplify fatigue beyond baseline mechanics. Current seeded exercises are standardized to 1.0 in philosophy terms, while method-specific inflation is intended for drop sets, supersets, rest-pause, and mechanical drop sets [NEEDS VERIFICATION].

Formula:

`fatigueCost = fatigueScore × stabilityDemand × methodFatigueMultiplier × (rpe / 10)`

This fatigue computation runs server-side on set persistence; the client does not own fatigue calculation.

### 5. Execution Zone

The current seeded ExecutionProfile records are `CONTROLLED`, `HYPERTROPHY`, and `PERFORMANCE`. This is not an enum in schema terms; it is a named database record (`ExecutionProfile.zone`) with unique values.

Execution zone informs the effort context for each exercise and influences how stimulus is interpreted relative to rep range and intent. [NEEDS VERIFICATION: exact stimulusScore formula per zone]

## Exercise Slot Architecture

An exercise slot is a functional position inside a training template that serves a specific biomechanical or hypertrophy role. Substitutions in Kinetiq occur by slot, not by random one-to-one movement swaps.

Example slots:

- Horizontal press slot (`Barbell Bench Press`, `Dumbbell Press`, `Machine Press`)
- Vertical pull slot (`Pull-Up`, `Lat Pulldown`, `Wide-Grip Pulldown`)
- Elbow flexion slot (`Barbell Curl`, `Dumbbell Curl`, `Cable Curl`)
- Quad-biased squat slot (`Back Squat`, `Hack Squat`, `Leg Press`)

Why this matters:

When an athlete has elbow irritation and rising spinal fatigue, the engine should preserve the horizontal or pull slot role while reducing local aggravation and systemic burden: keep slot intent, remove high-axial variants, and swap toward slot-equivalent options with better tolerance.

Substitution pools in schema (`SubstitutionPool`, `SubstitutionPoolExercise`) implement this slot logic, and pool members are treated as slot-equivalent.

[NEEDS VERIFICATION: SubstitutionPool seed data not yet written; engine substitution quality depends on populated pool membership.]

## Parent Exercise and Variation Logic

Many exercises are practical variations of a parent movement. They often share movement pattern, muscle bias, fatigue profile tendencies, and substitution-pool neighborhood, but differ by grip, joint friendliness, peak contraction emphasis, and equipment profile.

Example: Tricep Pushdown family variants (rope, straight bar, cable-rope implementation) are variation-level choices around the same slot-level intent.

The current schema does not model explicit parent-child exercise linkage, so records are effectively flat. In current architecture, MovementClass and SubstitutionPool membership provide a functional approximation for parent-variation reasoning.

[NEEDS VERIFICATION: whether a formal `parentExerciseId` is planned or pool-based grouping is the permanent approach.]

## Primary vs Secondary Muscle Logic & Overlap Fatigue

Secondary muscles accumulate meaningful indirect fatigue during compound work, and this materially changes isolation prescription strategy:

- Triceps accumulate during pressing patterns.
- Biceps accumulate during rowing and pull patterns.
- Front delts accumulate during pressing patterns.

The intended engine behavior is to down-adjust direct isolation recommendations when overlap fatigue is already high, using `secondaryMuscles[]` on Exercise to quantify indirect loading context.

Practical example: after a week containing bench press, incline press, and overhead press, direct triceps isolation volume should be reduced relative to a week with less pressing overlap.

[NEEDS VERIFICATION: confirm overlap-fatigue adjustment is fully implemented in current ProgressionEngine/FatigueEngine paths.]

## Rules for Adding New Exercises

1. Every exercise must have a `primaryMuscle` from `MuscleGroup` enum.
2. Every exercise must have a `movementPattern` from `MovementPattern` enum.
3. Every exercise must have a `movementClass` from `MovementClass` enum; if none fits, add deliberately through enum governance rather than ad hoc invention.
4. `fatigueScore` must be calibrated against known anchors; use Conventional Deadlift = 10 and machine isolations around 3-4.
5. `stabilityDemand` generally trends free weights > machines; evaluate unilateral movements carefully for per-limb stability cost.
6. `methodFatigueMultiplier = 1.0` for standard straight-set entries.
7. Use `kinetiq-api/docs/new-exercise-template.md` as the intake questionnaire.
8. After adding seed data, ensure upsert `update` blocks include `movementClass` and `category`, not only `create`; current `update: {}` behavior skips classification refresh on re-seed.

## Known Structural Gaps

1. SubstitutionPool seed data is absent from `seed.ts`; schema exists, but pool membership must be seeded before slot-based substitution can operate reliably.
2. Core exercises are currently unseeded despite six ready MovementClass values.
3. Re-seed classification bug: `upsert` with `update: {}` means pre-existing rows do not receive newer `movementClass` values without migration/backfill.
4. Orphan class-map entries: `movementClassByName` includes `Dumbbell Fly`, `Dumbbell Incline Fly`, `Dumbbell Decline Fly`, but these are not present in the seeded `exercises` array.
5. Fourteen MovementClass enum values are currently unassigned in the active exercise seed map (`CORE_*` six values plus deferred classes like stretch-biased/lengthened variants and selected glute/hamstring/tricep classes); these are intentional ontology reserves, not immediate schema errors. [NEEDS VERIFICATION]
