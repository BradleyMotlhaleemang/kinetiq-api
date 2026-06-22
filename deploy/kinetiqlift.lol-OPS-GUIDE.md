# Kinetiq — kinetiqlift.lol Operations & Deploy Guide

**Last updated:** June 2026  
**Purpose:** Portable reference when you switch machines, browsers, or hand off to another agent.  
**Domain:** `kinetiqlift.lol` (Porkbun)  
**Stack:** Hetzner CX23 + Coolify + Docker Compose + GHCR

---

## Quick reference

| Item | Value |
|------|-------|
| Hetzner project | `kinetiq-beta` |
| Server name | `ubuntu-4gb-nbg1-1` |
| Location | Nuremberg (`nbg1`) |
| Public IPv4 | `91.98.197.146` |
| Public IPv6 | `2a01:4f8:1c19:f67d::1` |
| Plan | CX23 — 2 vCPU, 4 GB RAM, 40 GB SSD |
| Monthly cap | ~€5.49/mo |
| Frontend URL | `https://app.kinetiqlift.lol` |
| API URL | `https://api.kinetiqlift.lol` |
| Coolify UI (temporary) | `http://91.98.197.146:8000` |
| GitHub owner | `bradleymotlhaleemang` |
| API repo | `kinetiq-api` (has `docker-compose.yml`) |
| App repo | `kinetiq-app` |
| API image | `ghcr.io/bradleymotlhaleemang/kinetiq-api:latest` |
| App image | `ghcr.io/bradleymotlhaleemang/kinetiq-app:latest` |

---

## SSH access

| Item | Value |
|------|-------|
| User | `root` |
| Port | `22` |
| Key type | ED25519 |
| Key name (Hetzner) | `kinetiq-deploy` |
| Private key (primary PC) | `C:\Users\bmotlhaleemang\.ssh\kinetiq_hetzner` |
| Public key | `C:\Users\bmotlhaleemang\.ssh\kinetiq_hetzner.pub` |

**PowerShell:**

```powershell
ssh -i $env:USERPROFILE\.ssh\kinetiq_hetzner root@91.98.197.146
```

**Using a different Windows machine:**

1. Copy `kinetiq_hetzner` (private) and `kinetiq_hetzner.pub` securely — USB encrypted, password manager file attachment, or cloud vault. **Never email the private key.**
2. Place at `%USERPROFILE%\.ssh\kinetiq_hetzner`
3. Fix permissions (PowerShell as admin optional):

   ```powershell
   icacls $env:USERPROFILE\.ssh\kinetiq_hetzner /inheritance:r /grant:r "$($env:USERNAME):(R)"
   ```

4. **Alternative:** Generate a new key on the new PC → Hetzner Console → Security → SSH keys → Add → attach to server (no need to replace the old key).

**Do not regenerate the Hetzner key casually** — update Hetzner + all your machines, or add additional keys alongside the existing one.

---

## Firewall (`kinetiq-beta-fw`)

| Protocol | Port | Source | Notes |
|----------|------|--------|-------|
| TCP | 22 | Your home IP /32 | Update when your IP changes |
| TCP | 80 | Any | HTTP / Let's Encrypt |
| TCP | 443 | Any | HTTPS |
| TCP | 8000 | Your home IP /32 | **Remove after Coolify is on HTTPS** |
| ICMP | — | Any | Ping |

**Never open:** 5432 (Postgres), 6379 (Redis).

**If SSH breaks after moving networks:** Your home IP changed. Hetzner Console → Firewalls → edit rule 22 to your new IP, or use Hetzner web console / rescue if available.

---

## DNS (Porkbun)

| Type | Host | Answer | TTL |
|------|------|--------|-----|
| A | `app` | `91.98.197.146` | 300 |
| A | `api` | `91.98.197.146` | 300 |

Verify:

```powershell
nslookup app.kinetiqlift.lol
nslookup api.kinetiqlift.lol
```

---

## Secrets & config (never commit)

| Secret | Where to generate | Where to store |
|--------|-------------------|----------------|
| `POSTGRES_PASSWORD` | `scripts/generate-production-secrets.ps1` | Coolify env + password manager |
| `JWT_SECRET` | same script | Coolify env + password manager |
| `JWT_REFRESH_SECRET` | same script | Coolify env + password manager |
| `SMTP_USER` / `SMTP_PASS` | Gmail app password | Coolify env |
| Coolify admin login | You chose at install | Password manager |
| GitHub PAT (if GHCR private) | GitHub → Developer settings | Coolify Docker registry |

**Template:** `deploy/kinetiqlift.lol.env.template`

**If you lose JWT secrets after users exist:** All sessions invalidate — users re-login.  
**If you lose `POSTGRES_PASSWORD` after DB is live:** Do not change it casually; recover from backup or reset DB (data loss).

---

## Known issues & gotchas (read before deploy)

### 1. GitHub Actions billing lock (blocker)

If Actions shows *"account is locked due to a billing issue"*, CI will not build images. **You do not need paid Actions** to deploy.

**Fix:** Build and push images manually — see `deploy/hetzner/MANUAL-IMAGE-BUILD.md`.

### 2. GHCR images must be AMD64

CX23 is x86. ARM images fail with `exec format error`.

**Fix:** Build on Windows (amd64) or Hetzner with `docker build` (not `arm64`).

### 3. App API URL is baked at build time (blocker)

`NEXT_PUBLIC_API_URL` is set when the **app Docker image** is built. It must be `https://api.kinetiqlift.lol`.

**Fix:** When building the app image manually, pass `--build-arg NEXT_PUBLIC_API_URL=https://api.kinetiqlift.lol` (see manual build guide).

### 4. Compose `build:` block on API service

`docker-compose.yml` includes a `build:` section for `api`. Coolify might try to **compile on the 4 GB server** and OOM.

**Fix:** Set `KINETIQ_API_IMAGE` / `KINETIQ_APP_IMAGE` and use pull-only deploy; remove or disable build in Coolify if offered.

### 4. GHCR package visibility

If packages are **private**, Coolify needs `ghcr.io` registry credentials (GitHub PAT with `read:packages`).

**Fix:** Add registry in Coolify, or make packages public for beta.

### 5. Two repos, one compose file

Deploy Compose from **`kinetiq-api`** only. `kinetiq-app` is for frontend source + CI image builds.

### 6. RAM pressure on CX23

Coolify + Postgres + Redis + API + App ≈ tight on 4 GB. Server already has **2 GB swap**. Do not build images on the server.

**Upgrade path:** Hetzner Console → resize to **CX33** (8 GB) if OOM during runtime.

### 7. SMTP unset = no verification emails

Registration works in DB but users won't get verify emails without `SMTP_USER` / `SMTP_PASS`.

### 8. Port 8000 exposure

Remove firewall rule 8000 once Coolify admin is reachable via HTTPS on 443.

### 9. Changing Windows machine mid-deploy

- SSH key portability (see above)
- Coolify login is browser-based — any machine with browser works
- GitHub / Hetzner / Porkbun — use same accounts, no machine tie-in

### 10. Hetzner firewall SSH IP

If you deploy from a café or phone hotspot, SSH may be blocked until you update the /32 rule.

---

## Deploy process (step-by-step checklist)

Check off as you go. **Stop after each step and confirm before continuing** (paired session workflow).

| Step | Task | Status |
|------|------|--------|
| 0 | Read this guide + known issues | ☐ |
| 1 | Verify SSH from current machine | ☐ |
| 2 | Generate secrets → save in password manager | ☐ |
| 3 | ~~Push amd64 CI~~ → **Manual build + push to GHCR** (see MANUAL-IMAGE-BUILD.md) | ☐ |
| 4 | GitHub PAT (`write:packages`) + `docker login ghcr.io` | ☐ |
| 5 | Confirm GHCR images exist (amd64) + packages public | ☐ |
| 6 | Coolify → connect GitHub → grant `kinetiq-api` (+ `kinetiq-app`) | ☐ |
| 7 | Coolify → add GHCR registry (if private) | ☐ |
| 8 | Coolify → new Docker Compose resource from `kinetiq-api` | ☐ |
| 9 | Set all env vars from template + secrets | ☐ |
| 10 | Map domains: `app` → app.kinetiqlift.lol:3001, `api` → api.kinetiqlift.lol:3000 | ☐ |
| 11 | Deploy → watch logs (postgres → redis → api migrate → app) | ☐ |
| 12 | SSH: `prisma db seed` with `SEED_SKIP_DEV_USERS=true` | ☐ |
| 13 | Smoke tests (`deploy/hetzner/SMOKE_TEST.md`) | ☐ |
| 14 | Remove firewall port 8000 | ☐ |
| 15 | UptimeRobot + Sentry (optional) | ☐ |
| 16 | Postgres backup cron | ☐ |

---

## Coolify env vars (copy reference)

```env
DOMAIN=kinetiqlift.lol
POSTGRES_PASSWORD=<from secrets script>
JWT_SECRET=<from secrets script>
JWT_REFRESH_SECRET=<from secrets script>
KINETIQ_API_IMAGE=ghcr.io/bradleymotlhaleemang/kinetiq-api:latest
KINETIQ_APP_IMAGE=ghcr.io/bradleymotlhaleemang/kinetiq-app:latest
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
TZ=Africa/Gaborone
```

API also gets automatically from compose: `FRONTEND_URL`, `CORS_ORIGINS`, `DATABASE_URL`, `REDIS_HOST`.

---

## Useful commands (on server)

```bash
# List containers
docker ps

# API logs
docker logs -f <api_container_name>

# Production seed (once, after first healthy deploy)
docker exec -e SEED_SKIP_DEV_USERS=true <api_container_name> npx prisma db seed

# Disk / memory
df -h
free -h
```

---

## Account bookmarks

| Service | URL |
|---------|-----|
| Hetzner Console | https://console.hetzner.com/projects |
| Porkbun DNS | https://porkbun.com/account/domainsSpeedy |
| GitHub API repo | https://github.com/BradleyMotlhaleemang/kinetiq-api |
| GitHub App repo | https://github.com/BradleyMotlhaleemang/kinetiq-app |
| GHCR packages | https://github.com/BradleyMotlhaleemang?tab=packages |
| Coolify (temp) | http://91.98.197.146:8000 |

---

## Revision log

| Date | Note |
|------|------|
| 2026-06-22 | Initial guide — server provisioned, DNS live, Coolify installed, deploy not started |
