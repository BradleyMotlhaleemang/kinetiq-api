# Runbook — Hetzner Cloud provisioning

Complete these steps before Coolify install. Estimated time: 30–60 minutes.

## Prerequisites

- Hetzner Cloud account + payment method
- ED25519 SSH key pair
- Chosen domain name (register separately — see [RUNBOOK-DOMAIN.md](RUNBOOK-DOMAIN.md))

## 1. Create account

1. Go to [Hetzner Cloud Console](https://console.hetzner.cloud/)
2. Create a project: `kinetiq-beta`
3. Add payment method (card or PayPal)

## 2. Add SSH key

1. **Security → SSH keys → Add SSH key**
2. Paste your ED25519 public key
3. Name it e.g. `kinetiq-deploy`

## 3. Create Cloud Firewall

**Firewalls → Create Firewall** — name `kinetiq-beta-fw`

| Direction | Protocol | Port | Source | Action |
|-----------|----------|------|--------|--------|
| Inbound | TCP | 22 | Your public IP /32 | Allow |
| Inbound | TCP | 80 | 0.0.0.0/0, ::/0 | Allow |
| Inbound | TCP | 443 | 0.0.0.0/0, ::/0 | Allow |

Do **not** expose 5432 or 6379. Apply this firewall to the server after creation.

## 4. Create server

| Setting | Value |
|---------|-------|
| Name | `kinetiq-hetzner` |
| Location | **fsn1** (Falkenstein, DE) — or `nbg1` / `hel1` |
| Image | Ubuntu 24.04 |
| Type | **CX23** (2 vCPU, 4 GB RAM, 40 GB NVMe) |
| Networking | Public IPv4 **assign** |
| SSH key | Your key from step 2 |
| Firewall | `kinetiq-beta-fw` |

Record **public IPv4** — needed for DNS.

> **RAM note:** CX23 is tight with Coolify + Postgres + Redis + API + App. Configure **2 GB swap** (step 6). If deploy OOMs, upgrade to **CX33** (8 GB) in-console without reinstalling.

## 5. Initial SSH hardening

```bash
ssh root@<VM_IP>

# Create deploy user
adduser deploy
usermod -aG sudo deploy
mkdir -p /home/deploy/.ssh
cp ~/.ssh/authorized_keys /home/deploy/.ssh/
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys

# Disable password SSH (after confirming key login as deploy)
sed -i 's/^#*PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
systemctl reload sshd
```

## 6. Swap (2 GB)

```bash
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

## 7. Automatic security updates

```bash
apt update && apt install -y unattended-upgrades
dpkg-reconfigure -plow unattended-upgrades
```

## 8. Install Coolify

```bash
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
```

After install:

1. Open Coolify UI (`http://<VM_IP>:8000` or the URL shown by the installer)
2. Create admin account
3. Add this server as the deployment target
4. Restrict Coolify dashboard port via firewall if exposed publicly

Optional: connect Hetzner API token in Coolify to provision servers from the UI ([Coolify Hetzner API](https://coolify.io/docs/api-reference/api/operations/create-hetzner-server)).

## 9. Connect repository

1. New project: `kinetiq-beta`
2. Add **Docker Compose** resource — point to `docker-compose.yml` in `kinetiq-api` repo
3. Connect GitHub; enable webhook on `main`
4. Configure GHCR registry auth if packages are private
5. **Pull GHCR images** — do not build on VM (saves RAM on CX23)

## Checklist

- [ ] Hetzner account + payment method
- [ ] CX23 server running with public IP
- [ ] Cloud Firewall allows 22 (your IP), 80, 443
- [ ] Swap configured
- [ ] Coolify installed and GitHub connected

Next: [RUNBOOK-DOMAIN.md](RUNBOOK-DOMAIN.md) → configure DNS and deploy secrets.
