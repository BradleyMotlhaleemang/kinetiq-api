# Mesocycle Philosophy & Adaptive Training Architecture

## Core Philosophy Statement

"A hypertrophy mesocycle is not a static linear progression template.
It is an adaptive stress-management system.

The core objective: apply enough stimulus to drive hypertrophy while
dynamically regulating fatigue so progression can continue sustainably.

The system continuously balances: Stimulus · Recovery · Fatigue ·
Performance · Motivation · Joint Integrity · Long-term Adherence.

This creates an autoregulated hypertrophy ecosystem, not a fixed spreadsheet."

## What Is a Mesocycle?

A structured accumulation and recovery period designed to progressively increase productive hypertrophy stimulus while managing fatigue and maintaining recovery capacity.

Typical structure:

- Duration: 4-8 weeks
- Loading weeks: 3-6
- Deload week: 1

In Kinetiq, a Mesocycle record is generated from a WorkoutTemplate, linked to a user's GoalMode, and owns `currentWeek`, `volumeTargets` (JSON), and `status`. It is the container within which all progression occurs.

## The Three Mesocycle Phases

### Phase 1 — Volume Accumulation

Purpose: establish recoverable training stress from a conservative entry point while building weekly productive volume.

Characteristics:

- Conservative week-1 entry near effective minimums
- Gradual, selective set increases by movement/muscle response
- Typical effort range around RPE 6-8.5
- Strict execution quality and technical repeatability
- Controlled approach to proximity-to-failure, not abrupt intensity spikes

Primary progression driver: controlled volume increase when recovery signals remain favorable.

### Phase 2 — Intensification / Ramping

Purpose: convert accumulated base work into higher-quality stimulus through better loading performance and tighter execution under meaningful effort.

Characteristics:

- Hypertrophy-oriented intensification (not powerlifting peaking)
- Volume generally stabilizes rather than climbing indefinitely
- Effort and intent rise while fatigue is monitored tightly
- Load progression is earned when reps are completed at target quality

Primary progression driver: rep and load quality under managed fatigue, not indiscriminate set inflation.

### Phase 3 — Deload & Recovery

Purpose: dissipate accumulated fatigue, restore recovery capacity, reduce joint stress, and resensitize the athlete to future loading.

Characteristics:

- Volume reduction typically around 40-70%
- Effort usually constrained around RPE 5-7
- Movement patterns are preserved to maintain motor continuity
- Deload is an adaptation-preserving reset, not inactivity

Primary progression driver: fatigue removal to protect long-term progression momentum.

## Weekly Progression Logic

The system does not force progression. Progression is earned.

### Good Recovery & Performance

Conditions: stable motivation, low lingering soreness, solid sleep, low joint pain, reps achieved, and upward performance trend.

Engine behavior: add reps, then load, then sets (priority order), while preserving execution quality.

### Moderate Recovery

Conditions: mild fatigue, mild soreness, slight motivation drop, and stagnant but non-declining performance.

Engine behavior: maintain current workload and effort to stabilize fatigue and let adaptation catch up.

### Poor Recovery

Conditions: persistent soreness, joint pain, declining performance, CNS fatigue signs, and motivation collapse.

Engine behavior: reduce sets, reduce effort, optionally reduce load, and optionally remove high-cost exercises to prevent maladaptation and injury accumulation.

## Volume Progression Rules

Volume is the primary hypertrophy progression tool, but only increases when recovery permits, performance supports it, and execution quality remains high.

### Increase

Conditions: positive recovery metrics, stable biofeedback, target reps achieved consistently, and no active safety constraints.

Behavior: selectively add volume by muscle or slot, not globally.

### Pause

Conditions: mixed readiness, flat trend, or accumulating but still manageable fatigue.

Behavior: hold volume and intensity steady to absorb stress and protect execution quality.

### Regress

Conditions: persistent fatigue flags, repeated underperformance, rising joint discomfort, or compounding readiness decline.

Behavior: remove 1-2 sets from affected patterns/muscles and reduce weekly volume by roughly 20-40% until recovery restores progression capacity.

Example set progression (muscle-specific, not global): Week 1: 3 sets -> Week 2: 4 sets -> Week 3: 4 sets -> Week 4: 5 sets.

## Fatigue Accumulation Logic

Productive fatigue signs:

- Mild, transient soreness
- Temporary and recoverable performance suppression
- Manageable tiredness between sessions
- Stable motivation and session confidence

Excessive fatigue signs:

- Persistent soreness that does not clear in normal windows
- Declining pumps and contraction quality
- Downward performance trend despite effort
- Sleep deterioration and motivational collapse
- Joint pain accumulation
- Persistent heaviness and poor between-session recovery

## Volume Architecture in Kinetiq

### MEV and MRV

MEV (Minimum Effective Volume) is the lowest weekly volume that still drives measurable adaptation. MRV (Maximum Recoverable Volume) is the highest weekly volume an athlete can recover from while maintaining progression quality.

`Mesocycle.volumeTargets` stores per-muscle MEV floors and MRV ceilings as JSON. Generation-time logic reads GoalMode parameters and sets initial MEV-MRV ranges accordingly. This is confirmed behavior per system architecture.

### GoalMode Influence at Generation

- `STRENGTH`: lower volume bias, higher intensity bias, 240s rest default, 1.2x increment multiplier.
- `MUSCLE_GAIN`: MEV-MRV mid-range bias, moderate rest default, 1.0x multiplier.
- `MAINTAIN`: MEV-floor bias, lower progression pressure, 90s rest default, 0.8x multiplier.
- `WEIGHT_LOSS`: MEV-floor bias with elevated conditioning context, 60-90s rest default, 0.8x multiplier.
- `SPORT_SPECIFIC`: exercise-dependent biasing by sport demand and role priorities. [NEEDS VERIFICATION]

Critical rule: GoalMode never overrides ProgressionEngine Steps 1, 2, or 3 (readiness override, safety override, soreness gate). A `STRENGTH` user with high joint pain receives the same safety protections as a `MAINTAIN` user. This is a non-negotiable architectural constraint, not a soft preference.

### VolumeSnapshot

VolumeSnapshot is intended as a per-muscle, per-week time-series record written by the `sflDailyUpdate` worker rather than by `WorkoutsService` directly, with uniqueness on `userId + mesocycleId + weekNumber + muscle` to prevent duplicate writes during retries. [NEEDS VERIFICATION]

## Mesocycle Status Lifecycle

`ACTIVE -> DELOAD_TRIGGERED -> DELOAD_ACTIVE -> COMPLETED`

- `ACTIVE`: mesocycle is running normal progression logic and accumulating training stress.
- `DELOAD_TRIGGERED`: system has flagged a fatigue-recovery threshold and queued deload transition behavior.
- `DELOAD_ACTIVE`: deload prescriptions are currently active and progression constraints are tightened.
- `COMPLETED`: block is closed and no longer accepts normal progression updates.

[NEEDS VERIFICATION: current backend write paths explicitly setting `DELOAD_TRIGGERED` and `DELOAD_ACTIVE`.]

## Deload Trigger Logic

Opening principle: deloads are fatigue-based first; calendar-based deloads are fallback protection, not the primary control.

1. `SFL72h` elevated above threshold for 3+ consecutive days  
   - Evaluates persistent short-window fatigue burden above tolerance.  
   - Action: set `Mesocycle.status = DELOAD_TRIGGERED`.

2. Overtraining risk level `MODERATE` or above  
   - Evaluates composite overreaching risk from fatigue/recovery trend data.  
   - Action: write `OvertrainingLog` and trigger `RECOVERY_WARNING` notification.

3. Biofeedback soreness > 7 on primary muscle groups for 48+ hours  
   - Evaluates unresolved local fatigue and recovery failure by target tissues.  
   - Action: block progression for affected muscles and force `MAINTAIN_LOAD`.

4. `Mesocycle.currentWeek` beyond planned peak week with no deload taken  
   - Evaluates structural progression horizon risk independent of subjective feedback.  
   - Action: initiate automatic deload regardless of subjective signal quality.

All four triggers are evaluated daily by a FatigueEngine CRON, not on session completion.

Subjective deload signals feeding these triggers through weekly and session feedback:

- Repeated performance decline
- Persistent soreness
- Joint pain accumulation
- Motivation drop
- Sleep deterioration
- Psychological burnout

## Joint Pain Logic

Joint pain is not productive fatigue and must be managed separately from soreness.

Expected pain-handling policy:

- Immediately halt progression pressure when pain is elevated.
- Trigger exercise review for local stress sources.
- Reduce local stress while preserving slot intent.

Pain scoring guidance via SubstitutionEngine:

- 1-4: normal prescription with monitoring.
- 5-6: `MAINTAIN_LOAD`, cap RPE around 8, no forced substitution yet.
- 7-10: automatic substitution and `ExerciseSubstitution` record creation.

Possible modifications before substitution threshold:

- Slot-preserving variation change
- ROM reduction
- Load reduction
- Volume reduction
- Cable/machine substitution inside same slot

[NEEDS VERIFICATION: exact threshold enforcement and substitution trigger implementation path.]

## Exercise Slot Logic Within Mesocycles

An exercise slot is a functional position in the template that serves a specific biomechanical role. When substitution occurs, the engine substitutes within the slot so the hypertrophy intent remains intact while local stress profile changes.

This preserves:

- Mesocycle structural integrity during substitutions
- Muscle-group volume target continuity despite swaps
- Slot-equivalent exercise selection through `SubstitutionPool`

Template vs Progression distinction:

- Template defines structure, slots, and exercise categories (static).
- Progression engine defines load, volume, rep adaptation, and regression/progression (dynamic).
- Mesocycle owns week tracking, fatigue state, and `volumeTargets` as the adaptive container.

## Primary vs Secondary Muscle Logic

Primary muscles:

- Receive progression priority
- Receive higher recoverable direct volume
- Are tracked directly by volume-state architecture

Secondary muscles (overlap fatigue):

- Accumulate indirect fatigue from compounds
- Usually require less direct isolation volume
- Common examples: triceps from pressing, biceps from rows/pulls, front delts from pressing

Engine intent: use `secondaryMuscles[]` from compound movements to adjust isolation prescriptions and avoid redundant fatigue stacking.

[NEEDS VERIFICATION: confirm overlap-fatigue adjustment implementation in live progression paths.]

## Maintenance Volume

Maintenance volume preserves muscle with minimal added fatigue and is used during specialization offsets, recovery-focused periods, or prioritization blocks.

Typical maintenance target is roughly one-third to one-half of normal hypertrophy volume (example: 16 weekly chest sets -> approximately 5-8 maintenance sets).

## Known Gaps / Open Questions

1. `currentWeek` auto-advance exists as CRON-driven logic in worker code, but full architecture parity and edge-condition behavior should be confirmed before relying on it for all progression states. [NEEDS VERIFICATION]
2. `VolumeSnapshot` persistence should be confirmed; current worker evidence highlights `FatigueSnapshot` writes and may not yet include dedicated volume snapshots. [NEEDS VERIFICATION]
3. `GET /mesocycles/:id/expand` exists in backend routes, but frontend API module does not currently consume it; endpoint contract and intended UI usage should be documented.
4. Substitution pool membership is not seeded; slot-based substitutions cannot function reliably until pool data is populated.
