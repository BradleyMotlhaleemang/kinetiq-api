# Manual Docker image build (no GitHub Actions)

Use this when GitHub Actions is unavailable (billing lock, quota, etc.).  
Images still go to **GHCR**; Coolify pulls them the same way.

---

## What you need

1. **GitHub Personal Access Token (classic)** with scope: `write:packages` (and `read:packages`)
   - GitHub → Settings → Developer settings → Personal access tokens → Generate new token (classic)
2. **Docker** — either:
   - **Option A (recommended):** Docker Desktop on Windows — start it before building
   - **Option B:** Build on the Hetzner server (already has Docker; tight on 4 GB RAM — build one image at a time)

---

## One-time: log in to GHCR

**Windows (PowerShell):**

```powershell
$env:CR_PAT = "ghp_YOUR_TOKEN_HERE"   # paste token; do not commit
$env:CR_PAT | docker login ghcr.io -u BradleyMotlhaleemang --password-stdin
```

**On Hetzner (SSH):**

```bash
echo "ghp_YOUR_TOKEN_HERE" | docker login ghcr.io -u BradleyMotlhaleemang --password-stdin
```

---

## Option A — Build on Windows (recommended)

**Start Docker Desktop first** (whale icon in system tray must be running).

```powershell
# API image
cd C:\Users\bmotlhaleemang\Kinetiq\kinetiq-api
docker build -t ghcr.io/bradleymotlhaleemang/kinetiq-api:latest .
docker push ghcr.io/bradleymotlhaleemang/kinetiq-api:latest

# App image (API URL baked in at build time)
cd C:\Users\bmotlhaleemang\Kinetiq\kinetiq-app
docker build `
  --build-arg NEXT_PUBLIC_API_URL=https://api.kinetiqlift.lol `
  -t ghcr.io/bradleymotlhaleemang/kinetiq-app:latest .
docker push ghcr.io/bradleymotlhaleemang/kinetiq-app:latest
```

First build may take **10–20 minutes** each.

---

## Option B — Build on Hetzner server

SSH in, then run one image at a time. Swap is already configured.

```bash
ssh -i ~/.ssh/kinetiq_hetzner root@91.98.197.146

# Login (paste token when prompted or use echo pipe above)
docker login ghcr.io -u BradleyMotlhaleemang

# API
git clone https://github.com/BradleyMotlhaleemang/kinetiq-api.git /tmp/kinetiq-api
cd /tmp/kinetiq-api
docker build -t ghcr.io/bradleymotlhaleemang/kinetiq-api:latest .
docker push ghcr.io/bradleymotlhaleemang/kinetiq-api:latest

# App
git clone https://github.com/BradleyMotlhaleemang/kinetiq-app.git /tmp/kinetiq-app
cd /tmp/kinetiq-app
docker build \
  --build-arg NEXT_PUBLIC_API_URL=https://api.kinetiqlift.lol \
  -t ghcr.io/bradleymotlhaleemang/kinetiq-app:latest .
docker push ghcr.io/bradleymotlhaleemang/kinetiq-app:latest

# Cleanup clones to save disk
rm -rf /tmp/kinetiq-api /tmp/kinetiq-app
```

If build OOMs, use Option A on a PC with more RAM, or resize server to CX33 temporarily.

---

## Make packages public (easiest for Coolify)

After first push:

1. https://github.com/BradleyMotlhaleemang?tab=packages
2. Open `kinetiq-api` and `kinetiq-app` packages
3. Package settings → **Change visibility** → **Public**

Then Coolify can pull without registry credentials.

---

## Future updates (no Actions)

After code changes on `main`, re-run the build + push commands above, then **Redeploy** in Coolify.

---

## Verify images

```bash
docker pull ghcr.io/bradleymotlhaleemang/kinetiq-api:latest
docker pull ghcr.io/bradleymotlhaleemang/kinetiq-app:latest
```

On server after pull, check architecture:

```bash
docker image inspect ghcr.io/bradleymotlhaleemang/kinetiq-api:latest --format '{{.Architecture}}'
# expect: amd64
```
