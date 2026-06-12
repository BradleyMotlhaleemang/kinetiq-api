# Runbook — Domain registration and DNS

## 1. Register domain

Register at any registrar (Namecheap, Cloudflare, Porkbun, etc.). Suggested patterns:

- `kinetiq.app`
- `getkinetiq.com`
- `kinetiq.co.bw`

Cost: ~$10–15/year. **Wait to create DNS records** until the Oracle VM has a stable public IPv4.

## 2. Required hostnames

| Host | Purpose |
|------|---------|
| `app.<domain>` | Next.js frontend |
| `api.<domain>` | NestJS API + refresh cookies |

Both must share the same parent domain for auth cookies.

## 3. DNS records

Replace `<VM_IP>` with Oracle instance public IPv4.

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | `app` | `<VM_IP>` | 300 |
| A | `api` | `<VM_IP>` | 300 |

Optional IPv6 AAAA records if OCI assigned IPv6.

## 4. Verify propagation

```bash
dig app.<domain> +short
dig api.<domain> +short
```

Both must return `<VM_IP>` before requesting SSL certificates.

## 5. Coolify domain mapping

In Coolify compose resource:

| Service | Domain |
|---------|--------|
| `app` | `https://app.<domain>` |
| `api` | `https://api.<domain>` |

Enable Let's Encrypt. Wait for certificate issuance (usually 1–5 minutes after DNS).

## 6. Update configuration

1. Set GitHub repo variable `KINETIQ_DOMAIN` = `<domain>` (for CI app image builds)
2. Set Coolify / `deploy/.env`:

```env
DOMAIN=<domain>
FRONTEND_URL=https://app.<domain>
```

3. Rebuild and redeploy **app** image after changing `NEXT_PUBLIC_API_URL`

## Checklist

- [ ] Domain registered
- [ ] A records for `app` and `api` point to VM IP
- [ ] `dig` confirms propagation
- [ ] Coolify SSL active on both hosts
- [ ] `KINETIQ_DOMAIN` set in GitHub; app image rebuilt

Next: set production secrets (DEPLOYMENT_PLAN.md Phase 6) and run [SMOKE_TEST.md](SMOKE_TEST.md).
