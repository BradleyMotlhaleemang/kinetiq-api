# Kinetiq API (Backend)

Backend API for Kinetiq built with NestJS + Prisma.

## Tech Stack

- NestJS (TypeScript)
- Prisma ORM
- PostgreSQL
- Bull/BullMQ (Redis-backed queues)
- JWT auth

## First-Time Setup (After Clone)

### 1) Prerequisites

- Node.js 18+ (recommended: latest LTS)
- npm 9+
- PostgreSQL running
- Redis running (required for queues)

### 2) One-command setup (recommended)

From the `kinetiq-api` folder:

```bash
npm run setup
```

This runs:

```bash
npm install
npx prisma generate
npx prisma migrate deploy
npx prisma db seed
```

### 3) Create environment file

Create a `.env` file in `kinetiq-api` with at least:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/kinetiq
JWT_SECRET=replace_me
JWT_REFRESH_SECRET=replace_me_too
FRONTEND_URL=http://localhost:3001

REDIS_HOST=localhost
REDIS_PORT=6379
```

Required for email verification and password reset (Gmail example):

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-test@gmail.com
SMTP_PASS=<Gmail App Password — 16 chars from Google Account → Security → App passwords>
```

### Auth audit log (admin)

Query recent auth events without inspecting application code:

```sql
SELECT "createdAt", event, reason, email, "ipAddress"
FROM "AuthAuditLog"
ORDER BY "createdAt" DESC
LIMIT 50;
```

Expected events: `REGISTRATION`, `VERIFICATION_SENT`, `VERIFICATION_COMPLETED`, `LOGIN_SUCCESS`, `LOGIN_FAILED`, `PASSWORD_RESET_REQUESTED`, `PASSWORD_RESET_COMPLETED`, `LOGOUT`, `ACCOUNT_LOCKED`.

### 4) Generate Prisma client and run DB migrations (manual)

```bash
npx prisma generate
npx prisma migrate deploy
```

For local development, if needed:

```bash
npx prisma migrate dev
```

### 5) Seed data (required for templates and starter content)

```bash
npx prisma db seed
```

The default seed loads the **10 split template catalog** (Full Body, Upper/Lower, PPL, etc. with full exercise prescriptions and `MesocycleTemplate` duration metadata).

To use the legacy split template path instead:

```bash
SEED_SPLIT_CATALOG=false SEED_SPLIT_TYPES=true npx prisma db seed
```

On Windows PowerShell:

```powershell
$env:SEED_SPLIT_CATALOG="false"; $env:SEED_SPLIT_TYPES="true"; npx prisma db seed
```

Alternative direct command:

```bash
npx ts-node ./prisma/seed.ts
```

### 6) Run the API

```bash
npm run start:dev
```

Default API base URL: `http://localhost:3000/api/v1`

## Seeded Development Accounts

`prisma/seed.ts` creates stable development users so collaborators can log in immediately after setup:

- `dev@kinetiq.local`
- `coach@kinetiq.local`

Default password:

```text
DevPass123!
```

Override with `DEV_SEED_PASSWORD` in `.env` for local customization.

## New Machine / After Pull Checklist

Run this in order from `kinetiq-api`:

```bash
npm install
npx prisma generate
npx prisma migrate deploy
npx prisma db seed
npm run start:dev
```

If you are in active local development and have schema changes not yet reflected in your local DB:

```bash
npx prisma migrate dev
```

## Troubleshooting: Schema and Templates Not Visible

- Confirm you are connected to the expected database in `.env` (`DATABASE_URL`).
- Run `npx prisma migrate deploy` (or `npx prisma migrate dev` locally) to apply schema changes.
- Run `npx prisma db seed` so template data is inserted/updated.
- Verify connection and applied migrations:

```bash
npx prisma migrate status
```

- If local DB state is corrupted/drifted and this is a non-production environment, reset and reseed:

```bash
npx prisma migrate reset
```

This command is destructive and drops local data before reapplying migrations and seed.

## DATABASE_URL password format

In a URL like:

```env
DATABASE_URL="postgresql://postgres:Postsql@localhost:5432/kinetiq_db"
```

- username is `postgres`
- password is `Postsql`
- host is `localhost`
- port is `5432`
- database name is `kinetiq_db`

If your password contains special characters (for example `@`, `:`, `/`, `#`), URL-encode it.

## Useful Commands

```bash
npm run start:dev
npm run start
npm run build
npm run test
npm run test:e2e
npm run lint
```
