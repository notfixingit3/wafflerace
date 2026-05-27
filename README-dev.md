# Wafflerace - Docker Compose Files

This project provides two compose files that run behind **Traefik** with Let's Encrypt and **CrowdSec** protection.

**All required customizations and CrowdSec + Traefik setup instructions are documented directly inside the compose files** using a clear "PREREQUISITES / CUSTOMIZATION CHECKLIST" at the very top.

---

## ⚠️ Required Customizations (You Must Change These)

Before starting either compose file, open it and update the following:

| Setting                        | What to Change                                      | Location in File                  |
|--------------------------------|-----------------------------------------------------|-----------------------------------|
Each compose file now starts with a clear **"PREREQUISITES / CUSTOMIZATION CHECKLIST"** right after the `version:` line.

This checklist covers all fields you must change:
- Let's Encrypt email
- Hostnames / domains
- CrowdSec bouncer API key
- External network name (`proxy`)
- Production image version (strongly recommended to pin)

**Example domains used in this repo:**
- Development: `dev-wafflerace.projectsyrup.app`
- Production:  `wafflerace.projectsyrup.app`

Open the compose file you want to use — the checklist at the top tells you exactly what to edit and how.

## Available Files

| File                        | Environment   | Image                  | Domain                              |
|----------------------------|---------------|------------------------|-------------------------------------|
| `docker-compose.dev.yml`   | Development   | Local build            | `dev-wafflerace.projectsyrup.app`  |
| `docker-compose.prod.yml`  | Production    | GHCR (`:latest`)       | `wafflerace.projectsyrup.app`      |

## Quick Start (Development)

```bash
docker network create proxy
mkdir -p traefik/letsencrypt traefik/dynamic crowdsec/config crowdsec/data

docker compose -f docker-compose.dev.yml up -d crowdsec
docker exec crowdsec cscli bouncers add traefik-bouncer
# → Paste key into CROWDSEC_API_KEY

docker compose -f docker-compose.dev.yml up -d
```

## Quick Start (Production)

The process is nearly identical:

```bash
docker compose -f docker-compose.prod.yml up -d crowdsec
docker exec crowdsec cscli bouncers add traefik-bouncer-prod
# → Paste key

docker compose -f docker-compose.prod.yml up -d
```

## Useful Commands

```bash
# Development
docker compose -f docker-compose.dev.yml logs -f
docker compose -f docker-compose.dev.yml up -d --build

# Production
docker compose -f docker-compose.prod.yml logs -f
docker compose -f docker-compose.prod.yml pull && docker compose -f docker-compose.prod.yml up -d
```

## Notes

- Both files expect a shared external network called `proxy`.
- Make sure your DNS records are pointed before starting (for certificate issuance).
- It is strongly recommended to pin image versions in production instead of using `:latest`.
