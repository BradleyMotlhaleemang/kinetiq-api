# Runbook — Oracle Cloud provisioning (Johannesburg)

Complete these steps before Coolify install. Estimated time: 1–72 hours (capacity-dependent).

## Prerequisites

- Credit/debit card (verification hold only)
- ED25519 SSH key pair
- Chosen domain name (register separately — see [RUNBOOK-DOMAIN.md](RUNBOOK-DOMAIN.md))

## 1. Create account

1. Go to [Oracle Cloud Free Tier](https://www.oracle.com/cloud/free/)
2. **Home region:** South Africa Central (Johannesburg) / `af-johannesburg-1`
3. Complete identity and payment verification

## 2. Create VCN (if not using default)

Oracle wizard often creates a VCN with public subnet. Ensure:

- Public subnet with internet gateway
- Route table sends `0.0.0.0/0` to internet gateway

## 3. Security list / NSG

| Direction | Port | Source | Action |
|-----------|------|--------|--------|
| Ingress | 22 | Your public IP /32 | Allow |
| Ingress | 80 | 0.0.0.0/0 | Allow |
| Ingress | 443 | 0.0.0.0/0 | Allow |
| Ingress | * | 0.0.0.0/0 | Deny (default deny rest) |

Do **not** expose 5432 or 6379.

## 4. Launch compute instance

| Setting | Value |
|---------|-------|
| Name | `kinetiq-oci-jnb` |
| Image | Canonical Ubuntu 24.04 Minimal **aarch64** |
| Shape | `VM.Standard.A1.Flex` |
| OCPU / memory | **2 / 12 GB** |
| Boot volume | 50 GB |
| Network | Public IPv4 **assign** |
| SSH key | Your ED25519 public key |

### Out of capacity

- Retry every 15–30 minutes
- Use [oci-arm-catcher](https://github.com/alexpua/oci-arm-catcher)
- Upgrade to Pay As You Go (Always Free resources remain free)
- Use $300 trial for temporary larger shape while retrying

Record **public IPv4** — needed for DNS.

## 5. Initial SSH hardening

```bash
ssh -i ~/.ssh/your_key ubuntu@<VM_IP>

# Create deploy user
sudo adduser deploy
sudo usermod -aG sudo deploy
sudo mkdir -p /home/deploy/.ssh
sudo cp ~/.ssh/authorized_keys /home/deploy/.ssh/
sudo chown -R deploy:deploy /home/deploy/.ssh
sudo chmod 700 /home/deploy/.ssh
sudo chmod 600 /home/deploy/.ssh/authorized_keys

# Disable password SSH (after confirming key login as deploy)
sudo sed -i 's/^#*PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo systemctl reload sshd
```

## 6. Swap (2 GB)

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

## 7. Automatic security updates

```bash
sudo apt update && sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

## 8. Install Coolify

Follow [Coolify Oracle Cloud documentation](https://coolify.io/docs/knowledge-base/server/oracle-cloud).

After install:

1. Open Coolify UI (HTTPS on server IP or temporary domain)
2. Create admin account
3. Add this server as the deployment target
4. Restrict Coolify admin port via firewall if exposed

## 9. Connect repository

1. New project: `kinetiq-beta`
2. Add Docker Compose resource — point to monorepo `docker-compose.yml`
3. Connect GitHub; enable webhook on `main`
4. Configure GHCR registry auth if packages are private

## Checklist

- [ ] Oracle account created (JNB home region)
- [ ] A1 instance running with public IP
- [ ] Security list allows 22 (your IP), 80, 443
- [ ] Swap configured
- [ ] Coolify installed and GitHub connected

Next: [RUNBOOK-DOMAIN.md](RUNBOOK-DOMAIN.md) → configure DNS and deploy secrets.
