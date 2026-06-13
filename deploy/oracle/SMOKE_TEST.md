# Smoke test checklist — production acceptance

Run after first Coolify deploy with DNS and secrets configured.

## Auth and CORS

| # | Test | Pass criteria |
|---|------|---------------|
| 1 | Open `https://app.<domain>` | Login page renders |
| 2 | `https://api.<domain>/api/v1/health` | 200 JSON with `database: up`, `redis: up` |
| 3 | Browser console on login | No CORS errors calling `api.<domain>` |
| 4 | Register new user | 201; verification email received |
| 5 | Verify email link | Redirects to app; account verified |
| 6 | Login | Access token in sessionStorage |
| 7 | Inspect cookies on `api.<domain>` | httpOnly refresh cookie set (secure) |
| 8 | Wait 15 min or force 401 | Silent refresh via `/api/v1/auth/refresh` |
| 8b | Close browser, reopen app | Dashboard loads without login; proactive refresh on cold start |
| 9 | Logout | Cookie cleared; redirected to login |

## Application

| # | Test | Pass criteria |
|---|------|---------------|
| 10 | Start workout, log set, reload | Data persists |
| 10b | Airplane mode during set save | Yellow banner; set syncs when online |
| 11 | Complete workout | e1rm rollup in API logs or DB |
| 12 | Register page | No "Continue in Demo Mode" button (production build) |

## Security

| # | Test | Pass criteria |
|---|------|---------------|
| 13 | `nc -zv <VM_IP> 5432` from external network | Connection refused / timeout |
| 14 | `nc -zv <VM_IP> 6379` from external network | Connection refused / timeout |

## Observability

| # | Test | Pass criteria |
|---|------|---------------|
| 15 | Trigger test error (optional dev route) | Event in Sentry within ~1 min |
| 16 | UptimeRobot monitors | Both app and API show "Up" |
| 17 | Sentry alert rules | New-issue rule active |

## Performance

| # | Test | Pass criteria |
|---|------|---------------|
| 18 | Load app from Botswana | Noticeably faster than EU hosting (~5 ms vs 150+ ms) |

## First-time data

```bash
# Catalog seed (no dev users)
docker exec -e SEED_SKIP_DEV_USERS=true <api_container> npx prisma db seed
```

Create admin: register real account, then promote role in DB or admin script.

## Auth debugging

| Symptom | Likely cause |
|---------|--------------|
| CORS error | `FRONTEND_URL` / `CORS_ORIGINS` mismatch |
| 401 on refresh, no cookie | Wrong API URL, HTTP not HTTPS, subdomain mismatch |
| Cookie set but not sent | `sameSite` / domain; check `credentials: 'include'` |
| API unreachable | Wrong `NEXT_PUBLIC_API_URL` at build time — rebuild app image |
