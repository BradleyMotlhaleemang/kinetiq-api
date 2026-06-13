# Kinetiq — Oracle Cloud Deployment Plan

**Version:** 2.0 — June 2026  
**Target:** 10 active users (private beta), ~$1/month (domain only)  
**Stack:** Oracle Always Free A1 (Johannesburg) + Coolify + GitHub Actions + Docker Compose (ARM64)  
**Status:** Repo artifacts in place — follow manual runbooks for OCI, domain, and first deploy

---

## Executive summary

Kinetiq runs as two applications (`kinetiq-api`, `kinetiq-app`) backed by PostgreSQL and Redis on a single **Oracle Cloud Always Free** Ampere A1 VM in **Johannesburg** (`af-johannesburg-1`). **Coolify** handles deploys and SSL; **GitHub Actions** runs CI and publishes **ARM64** images to GHCR.

**Order of work matters.** Fix Phase 0 code/config before provisioning infra. Then domain + OCI + Coolify + DNS + secrets + smoke test.

| Phase | Focus | Blocks go-live? |
|-------|--------|-----------------|
| 0 | Code fixes (CORS, cookies, env templates) | **Yes** |
| 1 | Domain registration + Oracle account + VM | Yes |
| 2 | Coolify install | Yes |
| 3 | Docker Compose + GHCR images | Yes |
| 4 | GitHub Actions CI (already in repo) | Recommended before first deploy |
| 5 | DNS + SSL | Yes |
| 6 | Production secrets + seed strategy | Yes |
| 7 | Deploy + smoke test | Yes |
| 8 | Backups, monitoring, alerts, swap | Do within first week |

**Manual runbooks:** [deploy/oracle/RUNBOOK-OCI.md](deploy/oracle/RUNBOOK-OCI.md) · [deploy/oracle/RUNBOOK-DOMAIN.md](deploy/oracle/RUNBOOK-DOMAIN.md) · [deploy/oracle/SMOKE_TEST.md](deploy/oracle/SMOKE_TEST.md)

---

## Efficiency: why the NestJS monolith stays 24/7

With the current codebase, the API **must** run continuously:

| Component | Why 24/7 |
|-----------|----------|
| HTTP API | Standard long-lived server |
| 4 Bull `@Processor` workers | In-process; triggered on workout/mesocycle events |
| `MesocycleAdvanceWorker` | `@Cron` midnight in running process |
| Redis throttling | Redis + API connection always on |

**Adopted efficiencies (no rewrite):** GHCR pre-built ARM64 images (no on-VM builds), 2 OCPU / 12 GB shape, Docker memory limits, CI on GitHub, 2 GB swap, single VM compose stack.

**Rejected for v1:** Split API/worker containers (+RAM), serverless, Oracle Autonomous DB (not PostgreSQL).

---

## Architecture

```
Internet (Botswana ~5 ms RTT to JNB)
   │
   ▼
┌──────────────────────────────────────────────────────────────┐
│  OCI af-johannesburg-1 — VM.Standard.A1.Flex (2 OCPU, 12GB) │
│  Coolify (reverse proxy + Let's Encrypt)                      │
│                                                               │
│   https://app.<domain>  ──►  kinetiq-app (Next.js :3001)     │
│   https://api.<domain>  ──►  kinetiq-api (NestJS  :3000)     │
│                                                               │
│   Internal Docker network:                                    │
│     postgres:5432   redis:6379                                  │
└──────────────────────────────────────────────────────────────┘
```

Diagram source: [docs/diagrams/kinetiq-infrastructure.mmd](docs/diagrams/kinetiq-infrastructure.mmd)

---

## Phase 0 — Code blockers (complete in repo)

### 0.1 Production CORS (`kinetiq-api/src/main.ts`)

Production allows browser requests **only** from origins in `FRONTEND_URL` and optional `CORS_ORIGINS` (comma-separated). No wildcard; misconfiguration fails startup of CORS handler if `FRONTEND_URL` unset in production.

```env
FRONTEND_URL=https://app.<domain>
CORS_ORIGINS=https://app.<domain>
```

**Verify:** Browser devtools on production frontend — no CORS errors on `POST /api/v1/auth/login`.

### 0.2 Auth subdomain layout

```
https://app.<domain>   ← frontend (NEXT_PUBLIC_API_URL → API)
https://api.<domain>   ← backend (refresh cookie on this host)
```

Both share parent `<domain>`. Do not mix unrelated domains without redesigning auth.

### 0.3 Redis in production

```env
REDIS_HOST=redis
REDIS_PORT=6379
```

### 0.4 Repo artifacts

| Artifact | Path |
|----------|------|
| API Dockerfile | `kinetiq-api/Dockerfile` |
| App Dockerfile | `kinetiq-app/Dockerfile` |
| Compose | `docker-compose.yml` |
| Deploy env template | `deploy/.env.example` |
| Env examples | `kinetiq-api/.env.example`, `kinetiq-app/.env.example` |
| CI + GHCR | `.github/workflows/ci.yml` |
| Next standalone | `kinetiq-app/next.config.ts` (`output: 'standalone'`) |

### 0.5 Production seed

Run once after first deploy:

```bash
docker exec -e SEED_SKIP_DEV_USERS=true <api_container> npx prisma db seed
```

Skips `dev@kinetiq.local` and `coach@kinetiq.local`. Create real admin via registration + DB role update.

### 0.6 Dev bypass

"Continue in Demo Mode" on register is **development-only** (`NODE_ENV === 'development'`).

---

## Phase 1 — Domain + Oracle Cloud

See [deploy/oracle/RUNBOOK-OCI.md](deploy/oracle/RUNBOOK-OCI.md) and [deploy/oracle/RUNBOOK-DOMAIN.md](deploy/oracle/RUNBOOK-DOMAIN.md).

**Summary:**

1. Register `<domain>` (~$10–15/year) — do not point DNS until VM IP is known.
2. Oracle signup — home region **`af-johannesburg-1`** (locked at signup).
3. Create `VM.Standard.A1.Flex` — **2 OCPU, 12 GB**, Ubuntu 24.04 aarch64, 50 GB boot, public IPv4.
4. Security list: inbound **22** (your IP), **80**, **443** only. Deny **5432**, **6379** publicly.
5. Host: SSH keys, non-root user, 2 GB swap, `unattended-upgrades`, hostname `kinetiq-oci-jnb`.

**Capacity:** If "Out of host capacity", retry or use [oci-arm-catcher](https://github.com/alexpua/oci-arm-catcher). Pay As You Go upgrade may help priority (still $0 within Always Free).

---

## Phase 2 — Coolify

1. Install per [Coolify Oracle docs](https://coolify.io/docs/knowledge-base/server/oracle-cloud).
2. Project `kinetiq-beta`, connect GitHub monorepo.
3. Docker Compose resource from repo root `docker-compose.yml`.
4. Domains: `app.<domain>` → app service, `api.<domain>` → api service.
5. **Pull GHCR images** — do not build on VM (saves RAM).

Make GHCR packages **public** or add registry credentials in Coolify for `ghcr.io/<owner>/kinetiq-*`.

---

## Phase 3 — Docker Compose

Root [`docker-compose.yml`](docker-compose.yml) defines postgres, redis, api, app with memory limits. Copy [`deploy/.env.example`](deploy/.env.example) → `deploy/.env` on server (never commit).

Set in Coolify / `deploy/.env`:

```env
DOMAIN=yourdomain.com
KINETIQ_API_IMAGE=ghcr.io/<github-owner>/kinetiq-api:latest
KINETIQ_APP_IMAGE=ghcr.io/<github-owner>/kinetiq-app:latest
```

---

## Phase 4 — GitHub Actions CI + GHCR

Workflow: [`.github/workflows/ci.yml`](.github/workflows/ci.yml)

- **PR / push:** lint, test, build (api + app).
- **Push to `main`:** build and push `linux/arm64` images to `ghcr.io/<owner>/kinetiq-api` and `kinetiq-app`.

**Optional repo variable:** `KINETIQ_DOMAIN` — used for `NEXT_PUBLIC_API_URL` at image build time.

**Coolify webhook:** Trigger redeploy on successful `main` build.

---

## Phase 5 — DNS and SSL

After VM public IP is stable:

| Type | Name | Value |
|------|------|-------|
| A | `app` | `<VM IPv4>` |
| A | `api` | `<VM IPv4>` |

```bash
dig app.<domain> +short
dig api.<domain> +short
```

Coolify requests Let's Encrypt once DNS propagates.

---

## Phase 6 — Production secrets

**API (Coolify / compose):**

```env
NODE_ENV=production
DATABASE_URL=postgresql://kinetiq:<password>@postgres:5432/kinetiq
REDIS_HOST=redis
REDIS_PORT=6379
JWT_SECRET=<64+ char random>
JWT_REFRESH_SECRET=<64+ char random>
FRONTEND_URL=https://app.<domain>
CORS_ORIGINS=https://app.<domain>
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=<sender>
SMTP_PASS=<app password>
TZ=Africa/Gaborone
SENTRY_DSN=<optional>
SENTRY_ENVIRONMENT=production
SENTRY_RELEASE=<git sha>
```

**App:** `NEXT_PUBLIC_*` are baked at **image build** in CI — rebuild after changing API URL or Sentry DSN.

**First-time DB:**

```bash
# migrations run on api container start
docker exec -e SEED_SKIP_DEV_USERS=true <api_container> npx prisma db seed
```

---

## Phase 7 — Deploy and smoke test

Full checklist: [deploy/oracle/SMOKE_TEST.md](deploy/oracle/SMOKE_TEST.md)

---

## Phase 8 — Operations, backups, and alerts

### 8.1 Backups

Daily `pg_dump` cron on host; retain 7 days. Optional copy to OCI Object Storage (20 GB Always Free).

```bash
0 3 * * * docker exec <postgres_container> pg_dump -U kinetiq kinetiq | gzip > /backups/kinetiq-$(date +\%F).sql.gz
```

### 8.2 Alerts when things break

#### Sentry (application errors — primary)

| Layer | Captures |
|-------|----------|
| API | 5xx via `AllExceptionsFilter`; Prisma errors; bootstrap crashes |
| App | `global-error`; SSR errors; API client 5xx / network / 429 |

**Setup:**

1. Free [Sentry](https://sentry.io) account — one Next.js project or separate API/App projects.
2. Set `SENTRY_DSN` on API; `NEXT_PUBLIC_SENTRY_DSN` at app **build** time.
3. Set `SENTRY_RELEASE` to `GITHUB_SHA` in CI.

**Alert rules (configure after first deploy):**

| Rule | Condition | Notify |
|------|-----------|--------|
| New issue | A new issue is created | Email |
| Spike | Event frequency > N in 1 hour | Email or Slack |

**Weekly digest:** Sentry → Settings → Reports → enable Weekly Report.

#### UptimeRobot (availability — site down)

| Monitor | URL | Interval |
|---------|-----|----------|
| App | `https://app.<domain>` | 5 min |
| API | `https://api.<domain>/api/v1/health` | 5 min |

Free tier: email alerts when down. Complements Sentry (which catches "up but broken").

Also helps satisfy Oracle idle-usage expectations via periodic HTTP traffic.

#### Infrastructure

- OCI Console — CPU/RAM/disk metrics
- Coolify / `docker logs <container>`
- Oracle idle policy: avoid <20% CPU, network, and memory for 7 consecutive days; log into console monthly

### 8.3 Updates

- OS: automatic security patches
- App: merge to `main` → CI → GHCR → Coolify redeploy

---

## Background jobs (DevOps reference)

### Midnight cron

`MesocycleAdvanceWorker` — `@Cron(EVERY_DAY_AT_MIDNIGHT)` — uses container `TZ` (default `Africa/Gaborone`).

### Bull queues

| Queue | Trigger |
|-------|---------|
| `e1rm-rollup` | Workout completion |
| `sfl-daily-update` | Post-workout fatigue |
| `sfr-calculation` | Mesocycle activity |
| `biofeedback-prompt` | Post-workout |

Redis **required**; API container **must** stay running 24/7.

---

## Cost estimate

| Item | USD/mo |
|------|--------|
| OCI Always Free A1 | $0 |
| Domain (amortized) | ~$1 |
| SSL, GitHub Actions, Gmail SMTP, Sentry free | $0 |
| **Total** | **~$1** |

---

## Fallback

If Johannesburg A1 never provisions after 48–72 h: Pay As You Go retry, $300 trial temp shape, or Hetzner CX23 EU (~$5/mo, higher latency).

---

## Master checklist

### Code
- [x] CORS from `FRONTEND_URL` / `CORS_ORIGINS`
- [x] `.env.example` files
- [x] `SEED_SKIP_DEV_USERS` for production seed
- [x] `next.config.ts` standalone
- [x] Dev demo mode gated to development

### Repo
- [x] Dockerfiles, compose, `.dockerignore`, CI workflow

### Manual (you)
- [ ] Domain registered
- [ ] Oracle JNB account + A1 VM
- [ ] Coolify + compose deployed
- [ ] DNS A records + SSL
- [ ] Secrets in Coolify
- [ ] Production seed + admin user
- [ ] Smoke tests passed
- [ ] Sentry alerts + UptimeRobot configured
- [ ] Backup cron

---

## Revision log

| Date | Change |
|------|--------|
| 2026-06-11 | v1 — Hetzner CX23 plan |
| 2026-06-12 | v2 — Oracle JNB; merged DevOps brief; GHCR ARM64; alerts runbook |
