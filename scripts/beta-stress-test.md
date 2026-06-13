# Beta stress test matrix (Version 0.1)

Run against production or staging before inviting testers. Record pass/fail per row.

## Session persistence

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 1 | Browser refresh | Start workout, log 3 sets, refresh | All sets visible; same exercise context |
| 2 | Browser close (5 min) | Log sets, close tab, reopen within 5 min | Resume via dashboard or direct URL; sets intact |
| 3 | Browser close (2 hr) | Log sets, return within 2 hours | Workout still `IN_PROGRESS`; resume prompt or direct resume |
| 4 | Offline mid-set | Airplane mode, log set, restore network within 30s | Yellow banner while offline; set syncs without duplicate |
| 5 | Double-tap Save | Tap complete set twice quickly | One set in DB; no 409 error shown to user |

## Auth

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 6 | Cold start | Login, close browser, reopen app | No 401 on dashboard; session restored via refresh cookie |
| 7 | Mid-workout token | Wait 15+ min during workout | Sets still save after silent refresh |

## Lifecycle

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 8 | Start from dashboard | Start Workout on planned day | `PATCH /workouts/:id/start` runs; workout is `IN_PROGRESS` |
| 9 | Active workout list | After start, check dashboard | Workout appears in active/resume UI |

## Validation

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 10 | Invalid reps | Enter 0 or 999 reps | Client blocks; API returns 400 if bypassed |
| 11 | Invalid weight | Enter -5 or 600 kg | Client blocks; API returns 400 if bypassed |

## Infrastructure

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 12 | Health endpoint | `GET /api/v1/health` | 200 with `database: up`, `redis: up` |
| 13 | UptimeRobot | Configure monitors | App + API health URLs green |
| 14 | Backup restore | Run `scripts/backup-db.sh` then `scripts/restore-db.sh` | Data intact after restore |

## Sign-off

- Tester name:
- Date:
- Environment URL:
- Blockers before beta invite:
