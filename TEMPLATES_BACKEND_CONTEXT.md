# Kinetiq Templates Backend Context (AI Handoff)

This document is for implementing backend support for the current `kinetiq-app/app/templates/page.tsx` screen.

## Scope

- Implement backend for the Templates page UI.
- Focus on data structure and endpoints only.
- Do **not** modify progression engine decision logic, fatigue logic, or workout prescription logic.

---

## Current Frontend Reality

The templates page is currently driven by static constants in:

- `kinetiq-app/app/templates/page.tsx`

It expects template cards and detail modal data with fields equivalent to:

- `id`
- `name`
- `tag`
- `badge` (nullable)
- `goal`
- `experience`
- `durationWeeks`
- `frequencyPerWeek`
- `splitType`
- `accentKey`
- `description`
- `days: string[]`
- `stats: { label: string; value: string }[]`
- `featured: boolean`

The page also has:

- Filter chips (`All Goals`, `Hypertrophy`, `Strength`, `Powerbuilding`, `Full Body`)
- Matrix chips (`Experience`, `Duration`, `Days/Week`, `Equipment`) - currently static UI
- “Use Template” action that routes to `/mesocycles/new?templateId=<id>`
- Modal details with architecture/phase display (currently static)

---

## Existing Backend Capabilities (kinetiq-api)

Already exists in mesocycles module:

- `GET /api/v1/mesocycles/templates`
- `GET /api/v1/mesocycles/recommend`

Files:

- `src/mesocycles/mesocycles.controller.ts`
- `src/mesocycles/mesocycles.service.ts`

Current data model (Prisma):

- `WorkoutTemplate` (name, splitType, daysPerWeek, description?, goalTags[], experienceTags[])
- `SplitConfig`
- `SplitDay`
- `SplitDayExercise`

Schema file:

- `prisma/schema.prisma`

Template transformation utility:

- `src/common/transforms.ts` -> `transformWorkoutTemplate`

---

## Gaps to Close for Templates Page

### 1) Frontend data shape mismatch

Current backend `getTemplates()` returns DB-oriented structure:

- `WorkoutTemplate` + nested `splits.days.exercises`

Templates page needs presentation-oriented fields (`tag`, `badge`, `featured`, `stats`, `days[]`, etc.).

### 2) Missing dedicated templates API contract

Using `mesocycles/templates` works functionally, but the Templates page has richer needs:

- listing metadata
- filtering
- featured ordering
- detail payload for modal

### 3) Label mapping gaps

`transformWorkoutTemplate()` only maps split labels for:

- `PPL`, `UPPER_LOWER`, `FULL_BODY`

but app UI uses additional split types in places:

- powerbuilding and focused variants

---

## Recommended Backend Implementation

## A) Create a dedicated Templates module

Add:

- `src/templates/templates.module.ts`
- `src/templates/templates.controller.ts`
- `src/templates/templates.service.ts`
- `src/templates/dto/templates-query.dto.ts`

And import module in `src/app.module.ts`.

Reason:

- keeps mesocycle generation concerns separate from template catalog/read concerns
- avoids bloating `MesocyclesService`

## B) Add endpoint set

### `GET /api/v1/templates`

Query params:

- `goal?: string`
- `experience?: string`
- `splitType?: string`
- `daysPerWeekMin?: number`
- `daysPerWeekMax?: number`
- `featuredOnly?: boolean`
- `search?: string`

Returns array of `TemplateListItem`:

- `id`
- `name`
- `splitType`
- `splitTypeLabel`
- `daysPerWeek`
- `durationWeeks` (derive default from tags/seed rule or fixed fallback, e.g. 8)
- `description`
- `goalTags: string[]`
- `experienceTags: string[]`
- `featured: boolean`
- `badge: string | null`
- `tag: string` (primary display tag)
- `accentKey: 'primary' | 'secondary' | 'tertiary'`
- `days: string[]` (flattened from split config/day labels)
- `stats: { label: string; value: string }[]`

### `GET /api/v1/templates/:id`

Returns `TemplateDetail`:

- all `TemplateListItem` fields plus:
- `splits` with nested days and exercises
- `phases` (if not persisted yet, return deterministic derived default)
- `whatGetsCreated` summary object (mesocycle + workout generation explanation)

### `GET /api/v1/templates/recommendation`

Optional convenience endpoint (or keep using `mesocycles/recommend`):

- return `{ recommended, alternatives, rationale, profile }` aligned to current frontend expectation in mesocycle creation flow

---

## Mapping Rules (DB -> UI DTO)

From `WorkoutTemplate`:

- `goal` for card/filter: first item of `goalTags` (fallback `"General"`)
- `experience`: first item of `experienceTags` (fallback `"Intermediate"`)
- `tag`: first `goalTag` or humanized split label
- `badge`: rule-based
  - `daysPerWeek >= 6` -> `ADVANCED`
  - recommendation match -> `RECOMMENDED`
  - else `null`
- `featured`: rule-based
  - recommendation match first
  - or seeded template name priority
- `days`: flatten first split config day labels in order
- `stats`: build consistently:
  - `Sessions`: `${daysPerWeek}×/week`
  - `Duration`: `${durationWeeks} weeks`
  - `Focus`: derived from goal tags/split
  - `Frequency`: derived heuristic

---

## Seed/Data Requirements

Ensure `prisma/seed.ts` has complete metadata for templates used by UI:

- `description`
- `goalTags`
- `experienceTags`
- stable `name` values
- `SplitConfig` + `SplitDay` labels ordered and complete

If `durationWeeks`, `featured`, `badge`, `accentKey` are needed as persistent fields, either:

1. add schema fields + migration, or
2. keep them as service-derived presentation fields (faster, no migration)

Preferred for now: **service-derived**, to avoid schema churn.

---

## Validation + DTO Contract

Create strict DTOs for response typing in service/controller.

Use class-validator for query DTO.

Keep response keys stable and frontend-friendly; avoid leaking raw Prisma shape where possible.

---

## Backward Compatibility

- Do not break existing:
  - `GET /api/v1/mesocycles/templates`
  - `GET /api/v1/mesocycles/recommend`
- Either:
  - keep old routes untouched and add new `/templates` routes, or
  - have old route call new service mapper.

---

## Security/Auth

Templates are read-only catalog data.

Options:

- keep JWT guard for consistency with current protected app flow
- or allow public reads if product wants pre-auth browsing

Current app behavior assumes authenticated pages, so protected endpoints are acceptable.

---

## Suggested Step-by-Step for AI Implementer

1. Add `templates` module (controller/service/dto).
2. Implement `GET /templates` with filtering and mapped DTO output.
3. Implement `GET /templates/:id` detail endpoint.
4. Reuse/extend split label transform for all split types in `common/transforms.ts`.
5. Keep `mesocycles/templates` intact.
6. Add unit tests for mapping and filters.
7. Smoke test with seeded DB and verify frontend field parity.

---

## Acceptance Criteria

- Templates page can be switched from static data to API response without field adapters.
- API provides card-ready and modal-ready template payloads.
- Filtering by goal/search/days works.
- Recommendation/featured behavior is deterministic.
- No changes to progression/fatigue decision systems.

---

## Known Notes

- `schema.prisma` currently shows `WorkoutTemplate` defined with metadata fields (`description`, `goalTags`, `experienceTags`) in the lower declaration block used by the app; align implementation with generated Prisma client in current environment.
- `mesocycles.service.ts` already uses templates for recommendation; keep this behavior unchanged.
