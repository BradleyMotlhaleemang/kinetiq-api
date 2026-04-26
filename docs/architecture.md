# Kinetiq API Backend System Audit

Audit scope: all modules under `src`, worker processors, controllers, and available docs as of 2026-04-25.

Global constraints checked:
- No sprint endpoint plan exists in repo docs (`docs/planning/*` empty, and current `docs/architecture.md` contains audit content rather than a sprint endpoint matrix), so "missing endpoint" checks are marked as blocked where applicable.
- Queue stack is Bull (`@nestjs/bull` + `bull`), not BullMQ. Idempotency checks were applied to existing workers.

## App Module

| Module | Status (✅ ⚠️ ❌) | Issue found | Fix required |
|---|---|---|---|
| App | ⚠️ | Redis is only configured as Bull backend; no app-level atomic Redis operations are implemented or enforceable. | If business counters/state are added to Redis, implement atomic updates via `INCRBYFLOAT` or Lua script wrappers in a cache service. |

## Prisma Module

| Module | Status (✅ ⚠️ ❌) | Issue found | Fix required |
|---|---|---|---|
| Prisma | ✅ | No direct audit issues in requested checks. | None. |

## Auth Module

| Module | Status (✅ ⚠️ ❌) | Issue found | Fix required |
|---|---|---|---|
| Auth | ⚠️ | Intake uses inline `@Body()` object typing instead of DTO classes, so `ValidationPipe` cannot enforce field-level rules robustly. | Introduce DTOs with `class-validator` decorators for register/login/reset payloads. |

## Users Module

| Module | Status (✅ ⚠️ ❌) | Issue found | Fix required |
|---|---|---|---|
| Users | ⚠️ | Intake uses inline `@Body()` shape (no DTO class validation). | Add DTO classes with validation decorators for profile update payloads. |

## Exercises Module

| Module | Status (✅ ⚠️ ❌) | Issue found | Fix required |
|---|---|---|---|
| Exercises | ⚠️ | Service reads `substitutionPoolExercise` directly via Prisma, creating a boundary leak into substitution domain data. | Route substitution-pool reads through `SubstitutionEngineService` (or a dedicated substitution repository API). |

## GoalMode Module

| Module | Status (✅ ⚠️ ❌) | Issue found | Fix required |
|---|---|---|---|
| GoalMode | ✅ | No direct issues found in requested checks. | None. |

## Templates Module

| Module | Status (✅ ⚠️ ❌) | Issue found | Fix required |
|---|---|---|---|
| Templates | ⚠️ | Module registers `PrismaService` directly and queries template entities directly in service (acceptable for module-owned data) but no documented endpoint mapping exists in architecture sprint plan for completeness validation. | Keep template data ownership local, but add templates endpoint matrix to architecture sprint docs to enable planned-vs-implemented endpoint audit. |

## Mesocycles Module

| Module | Status (✅ ⚠️ ❌) | Issue found | Fix required |
|---|---|---|---|
| Mesocycles | ⚠️ | Cross-module Prisma reads (`user`, `workoutTemplate`) and `volumeTargets` is generated/stored but has no DTO intake validation contract when passed externally. | Move user/profile reads behind `UsersService`, template access behind module API, and add typed DTO schema if `volumeTargets` becomes client-provided. |

## Workouts Module

| Module | Status (✅ ⚠️ ❌) | Issue found | Fix required |
|---|---|---|---|
| Workouts | ⚠️ | Direct Prisma access to foreign aggregates (`user`, `exercise`, `performanceHistory`) breaks module boundaries. | Keep workout writes local and consume foreign domain reads via owning services/repositories. |

## Readiness Module

| Module | Status (✅ ⚠️ ❌) | Issue found | Fix required |
|---|---|---|---|
| Readiness | ⚠️ | Reads nutrition-owned models (`nutritionTarget`, `foodLog`) directly with Prisma. | Pull nutrition signals through `NutritionService` query methods instead of direct model access. |

## WeeklyFeedback Module

| Module | Status (✅ ⚠️ ❌) | Issue found | Fix required |
|---|---|---|---|
| WeeklyFeedback | ⚠️ | Inline `@Body()` payload typing without DTO validators. | Add DTO classes and validation decorators for weekly feedback submission. |

## Knowledge Module

| Module | Status (✅ ⚠️ ❌) | Issue found | Fix required |
|---|---|---|---|
| Knowledge | ✅ | No boundary/Redis/worker/JSON issues in requested scope. | None. |

## ProgressionEngine Module (Layer 2)

| Module | Status (✅ ⚠️ ❌) | Issue found | Fix required |
|---|---|---|---|
| ProgressionEngine | ⚠️ | Correctly has no HTTP controller (pass), but queries multiple domain models directly (`performanceHistory`, `plateauMarker`, `pRRecord`, `workout`). | Keep controller-free design; add domain repository interfaces to reduce cross-module direct Prisma access. |

## SubstitutionEngine Module (Layer 2)

| Module | Status (✅ ⚠️ ❌) | Issue found | Fix required |
|---|---|---|---|
| SubstitutionEngine | ⚠️ | Correctly has no HTTP controller (pass), but persists substitution records directly without a broader boundary contract. | Keep controller-free design; expose substitution operations via service interface and centralize domain ownership rules. |

## FatigueEngine Module (Layer 2)

| Module | Status (✅ ⚠️ ❌) | Issue found | Fix required |
|---|---|---|---|
| FatigueEngine | ❌ | Module/service/controller for `FatigueEngine` not found, so Layer 2 contract is incomplete. | Add a dedicated `fatigue-engine` module/service (no controller), or formally de-scope and update architecture docs. |

## Workers Module

| Module | Status (✅ ⚠️ ❌) | Issue found | Fix required |
|---|---|---|---|
| Workers | ❌ | Idempotency is inconsistent: `sfl-daily-update` always creates new `fatigueSnapshot`; `mesocycle-advance` can over-advance on rerun; workers use Bull not BullMQ. | Add idempotency keys + unique constraints (e.g., user+day), and guard updates with transactional/optimistic conditions (`currentWeek` check). |

## Biofeedback Module

| Module | Status (✅ ⚠️ ❌) | Issue found | Fix required |
|---|---|---|---|
| Biofeedback | ❌ | `sorenessLog` and `jointPainLog` are only inline-typed, not DTO-validated; JSON persisted with `as any`. 48hr query is semantically correct (`72h..24h`, desc, first). | Introduce DTOs (`@IsObject`, nested/record validation, numeric bounds), remove `as any`, and keep current 48hr filter semantics. |

## BodyMetrics Module

| Module | Status (✅ ⚠️ ❌) | Issue found | Fix required |
|---|---|---|---|
| BodyMetrics | ⚠️ | Inline `@Body()` typing without DTO validation. | Add DTO with validation decorators for metric submissions. |

## Notifications Module

| Module | Status (✅ ⚠️ ❌) | Issue found | Fix required |
|---|---|---|---|
| Notifications | ✅ | No direct issues found in requested checks. | None. |

## Analytics Module

| Module | Status (✅ ⚠️ ❌) | Issue found | Fix required |
|---|---|---|---|
| Analytics | ⚠️ | Broad cross-module direct Prisma reads (`mesocycle`, `performanceHistory`, `exercise`, `plateauMarker`, `progressionLog`, `userExerciseSFR`). | Introduce analytics read-model/projection layer instead of querying multiple domain tables directly. |

## Cardio Module

| Module | Status (✅ ⚠️ ❌) | Issue found | Fix required |
|---|---|---|---|
| Cardio | ⚠️ | Direct `user` model access from cardio service (boundary leak). | Use `UsersService` (or user domain repository API) for user existence/profile checks. |

## Nutrition Module

| Module | Status (✅ ⚠️ ❌) | Issue found | Fix required |
|---|---|---|---|
| Nutrition | ⚠️ | Direct `user` model reads and inline request body typing without DTO validation. | Access profile via user-domain API and add DTO/class-validator rules for nutrition intake/targets. |

## Timer Module

| Module | Status (✅ ⚠️ ❌) | Issue found | Fix required |
|---|---|---|---|
| Timer | ⚠️ | No Redis atomicity concerns found (Prisma-backed), but controller uses inline `@Body()` typing without DTO validation. | Add DTO validation for timer preference/history write payloads. |

## Missing Endpoints vs Sprint Plan

| Module | Status (✅ ⚠️ ❌) | Issue found | Fix required |
|---|---|---|---|
| Endpoint Coverage Check | ⚠️ | `docs/architecture.md` does not define a sprint endpoint matrix and `docs/planning` has no source markdown, so true planned-vs-implemented endpoint diff is blocked. | Add sprint endpoint matrix to architecture docs (module + route + method + owner), then rerun this audit for strict gap reporting. |
