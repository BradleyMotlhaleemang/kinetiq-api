# Kinetiq infrastructure diagrams

Scripts for generating the deployment architecture diagram (Hetzner CX23 + Coolify + Docker Compose + GitHub Actions).

## Files

| File | Tool | Best for |
|------|------|----------|
| `kinetiq-infrastructure.mmd` | [Mermaid](https://mermaid.live) | GitHub README, Notion, VS Code preview, quick edits |
| `kinetiq-infrastructure.d2` | [D2](https://d2lang.com) | Clean PNG/SVG exports, presentations, documentation |

## Mermaid — quick render

1. Open [mermaid.live](https://mermaid.live)
2. Paste contents of `kinetiq-infrastructure.mmd` (skip the top `%%` comment lines if you prefer)
3. Export PNG or SVG

Or in any Markdown file:

````markdown
```mermaid
<!-- paste diagram body here -->
```
````

## D2 — export to SVG/PNG

Install D2: https://d2lang.com/tour/install

```bash
cd docs/diagrams
d2 kinetiq-infrastructure.d2 kinetiq-infrastructure.svg
d2 kinetiq-infrastructure.d2 kinetiq-infrastructure.png
```

Or use the online editor: [play.d2lang.com](https://play.d2lang.com)

## Diagram contents

Both scripts show:

- Users (Botswana) → DNS (`app.*` / `api.*`)
- Hetzner CX23 firewall + Coolify (TLS, reverse proxy, deploy)
- Docker Compose: Next.js app, NestJS API, PostgreSQL, Redis
- API background jobs: midnight mesocycle cron + Bull workers
- GitHub Actions CI → Coolify CD (optional GHCR images)
- External SMTP for auth emails

Replace `yourdomain.com` with your real domain when publishing.

## Related docs

- [`../../DEVOPS_BRIEF.md`](../../DEVOPS_BRIEF.md) — DevOps handoff
- [`../../DEPLOYMENT_PLAN.md`](../../DEPLOYMENT_PLAN.md) — full deployment plan
