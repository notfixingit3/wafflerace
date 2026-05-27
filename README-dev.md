# Wafflerace - Docker Compose (Traefik-aware)

> **Note:** As of recent updates, Wafflerace no longer bundles Traefik or CrowdSec.

The compose files (`docker-compose.yml`, `docker-compose.dev.yml`, and `docker-compose.prod.yml`) now contain **only the application**.

They include the Traefik labels the app needs so it can be discovered by your existing Traefik instance (and optionally protected by your existing CrowdSec setup).

See the comments inside the compose files for the exact labels and how to customize them.

## Simple Local Development (no reverse proxy)

```bash
docker compose up -d --build
```

Visit http://localhost:9090
