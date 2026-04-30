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

### 2) Install dependencies

From the `kinetiq-api` folder:

```bash
npm install
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

Optional for password reset emails:

```env
SMTP_HOST=...
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
```

### 4) Generate Prisma client and run DB migrations

```bash
npx prisma generate
npx prisma migrate deploy
```

For local development, if needed:

```bash
npx prisma migrate dev
```

### 5) (Optional) Seed data

```bash
npx prisma db seed
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

## Useful Commands

```bash
npm run start:dev
npm run start
npm run build
npm run test
npm run test:e2e
npm run lint
```
