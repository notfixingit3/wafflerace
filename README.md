<p align="center">
  <img src="assets/logo.webp" width="250" alt="Wafflerace logo" />
</p>

<h1 align="center">Wafflerace</h1>

<p align="center">
  <strong>A warm, syrupy, waffle-themed animated race for random selection.</strong>
</p>

<p align="center">
  The cozy cousin of the classic browser duck race — built for streamers, giveaways, raffles, and fun decision-making moments.
</p>

<p align="center">
  <strong>🧇 Premium AI-generated waffles racing in boats.</strong><br>
  Maximum suspense. Winner only clear at the buzzer.
</p>

<p align="center">
  <a href="https://github.com/notfixingit3/wafflerace/actions"><img src="https://img.shields.io/badge/Go-1.25-00ADD8?logo=go" alt="Go"></a>
  <a href="https://www.docker.com/"><img src="https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker" alt="Docker"></a>
  <a href="https://templ.guide/"><img src="https://img.shields.io/badge/Templ-Used-FF6B6B?logo=go" alt="Templ"></a>
  <a href="https://daisyui.com/"><img src="https://img.shields.io/badge/DaisyUI-5.0-5A0EF8?logo=tailwindcss" alt="DaisyUI"></a>
</p>

---

## What is this?

Wafflerace is a premium, syrupy recreation of the classic browser duck race — built for streamers, giveaways, raffles, and dramatic random selections.

Paste a list of names, set the duration, and watch real AI-generated waffles paddle their boats with chaotic, variable speeds and natural bobbing. The race is deliberately engineered so the winner only becomes obvious in the final seconds.

It uses high-quality generated assets (50+ boat sprites + layered river backgrounds) instead of simple drawings, plus subtle synthesized audio and particles for a more alive, 2026-feeling experience.

You can browse the current boat collections and backgrounds directly:
- [Boat Collections](assets/boats/README.md)
- [Background Collections](assets/backgrounds/README.md)

This is a companion project to [Project Syrup](https://github.com/notfixingit3/waffle).

---

## Current Status

**v0.1.12 (In Progress)** — Infrastructure & Sustainability Release

This release focuses on making Wafflerace easier to run and maintain long-term:

- Docker images are now properly published to GHCR on every release (multi-arch: amd64 + arm64) with provenance, SBOM, and attestations.
- A `:dev` image is automatically published on pushes to the development branch for easy testing of the latest changes.
- Removed the previously bundled Traefik + CrowdSec stack. The compose files are now lightweight and designed to work with your existing reverse proxy setup.
- Release process is now strictly enforced — all version tags must come from the `dev` branch.
- Significant improvements to documentation and release tooling.

See the [changelog](CHANGELOG.md) for full details.

**v0.1.9** — Major asset milestone

- Completed the Flags of US boat collection (all 50 states).
- Launched the Flags of the World collection (first batch of countries).
- Improved the boat collections system to properly support themed/named collections.

Wafflerace uses high-quality AI-generated boat sprites and layered river backgrounds. The race is deliberately designed for maximum suspense — the winner only becomes visually obvious in the final seconds.

### Core Features

- Real-time animated race with up to 50 participants
- Strong visual clamping and final-phase jitter so no one looks like the winner until the end
- Parallax river backgrounds and particle effects
- Synthesized audio (water drone + splashes + win chime)
- Spectator mode with shareable links
- Full race history + analytics
- Boat collections / themes support
- Docker-ready (works well behind existing Traefik + optional CrowdSec)

---

## Tech Stack

- **Backend**: Go + Gin
- **Frontend**: Templ + HTMX + Tailwind CSS + DaisyUI
- **Animation**: HTML Canvas (for smooth performance at higher participant counts)
- **Packaging**: Docker + Docker Compose
- **Philosophy**: Keep it simple and boring. Readable names over clever ones.

---

## Deployment

Wafflerace is designed to run behind an **existing Traefik** reverse proxy (and optionally behind CrowdSec for protection). We no longer include a bundled reverse proxy or security stack.

The provided compose files contain **only the Wafflerace application** plus the minimal Traefik labels it needs.

### Assumptions
- You already have Traefik running with an external Docker network (usually named `proxy`).
- If you use CrowdSec, you have a middleware (commonly `crowdsec@file`) already configured in your Traefik.

### Docker Images

Images are published to GitHub Container Registry:

- Releases: `ghcr.io/notfixingit3/wafflerace:<version>` and `:latest`
- Development: `ghcr.io/notfixingit3/wafflerace:dev`

See the **Docker Images** section above and the comments inside the compose files for usage examples.

### Quick Start

**Simple local development (no reverse proxy):**

```bash
docker compose up -d --build
```

Then visit `http://localhost:9090`.

**Using with your own Traefik:**

Edit the labels in `docker-compose.dev.yml` or `docker-compose.prod.yml` to match your domain, then run:

```bash
docker compose -f docker-compose.prod.yml up -d
```

Full examples and label documentation live inside the compose files themselves.

---

## Relationship to Project Syrup

Wafflerace is a companion project to [Project Syrup](https://github.com/notfixingit3/waffle).

The long-term goal is to be able to use (or embed) the race functionality inside the main waffle application when needed for random draws, giveaways, or fun community moments.

For now it is developed as its own focused tool.

---

## Development

Active work happens on the `dev` branch.

The `main` branch is kept stable and contains the current README plus minimal supporting files.

### Local Development

```bash
docker compose up -d --build
```

Then visit `http://localhost:9090`.

See the compose files themselves for Traefik label examples when using an external reverse proxy.

### Getting Started with Docker (Quick)

**Easiest option (no reverse proxy):**

```bash
docker compose up -d --build
```

Visit http://localhost:9090.

**Using your own Traefik:**

1. Create the external network if it doesn't exist:
   ```bash
   docker network create proxy
   ```

2. Edit the labels in `docker-compose.dev.yml` or `docker-compose.prod.yml` with your domain.

3. Start the app:
   ```bash
   docker compose -f docker-compose.prod.yml up -d
   ```

For more details, see the comments inside the compose files and the Docker Images section below.

### Docker Images

Wafflerace publishes official images to GitHub Container Registry (GHCR).

**Available tags:**

- **Stable releases** (`v*` tags from the release workflow):
  - `ghcr.io/notfixingit3/wafflerace:<version>` — e.g. `v0.1.12`
  - `ghcr.io/notfixingit3/wafflerace:latest`

- **Development / bleeding edge** (built on every push to `dev`):
  - `ghcr.io/notfixingit3/wafflerace:dev`
  - `ghcr.io/notfixingit3/wafflerace:sha-<short-sha>` — for pinning to an exact commit

**Note:** The `:dev` image skips rebuilds for documentation-only changes.

**Recommended usage:**

| Use Case                  | Recommended Image                          | Notes                                      |
|---------------------------|--------------------------------------------|--------------------------------------------|
| Production / Staging      | `:latest` or a pinned `:<version>`         | Always prefer pinning in production        |
| Testing latest changes    | `:dev`                                     | Fast way to try work from the dev branch   |
| Reproducible / debugging  | `:sha-xxxx`                                | Pins to a specific commit                  |
| Local development         | Build locally (`build: .`)                 | Best when actively modifying the code      |

See the compose files for ready-to-use examples (including how to switch between building locally and using pre-built images).

All releases are created from the `dev` branch (enforced by CI).

#### Asset Conversion Helpers

We use WebP as the primary format for boats and backgrounds (much smaller files).

Useful commands:

```bash
npm run convert:boats          # Convert boat sprites to WebP
npm run convert:backgrounds    # Convert backgrounds to WebP
```

When creating new boat assets, **boats must always face right**. See `assets/boat-concepts/README.md` for the full rules.

### For Contributors

See [AGENTS.md](AGENTS.md) for architecture decisions, rules (including the Scooby-Doo commit requirement), and important context.

### Commit Messages

Every commit must end with a random Scooby-Doo quote. Examples:

- "Ruh-roh!"
- "Zoinks!"
- "Jinkies!"
- "Would you do it for a Scooby Snack?"
- "Puppy Power!"

---

## Special Thanks

Wafflerace exists because two glass artists kept running great waffles the hard way.

[**Dani Boo Glass**](https://www.instagram.com/dani_boo_glass/)  
[![Dani Boo Glass on Instagram](https://img.shields.io/badge/Instagram-dani__boo__glass-E4405F?logo=instagram&logoColor=white)](https://www.instagram.com/dani_boo_glass/)

[**Crysis Designs**](https://www.instagram.com/crysis_designs/)  
[![Crysis Designs on Instagram](https://img.shields.io/badge/Instagram-crysis__designs-E4405F?logo=instagram&logoColor=white)](https://www.instagram.com/crysis_designs/)

Special shout out to [Dani Boo Glass](https://www.instagram.com/dani_boo_glass/) and [Crysis Designs](https://www.instagram.com/crysis_designs/) for creating the original Waffle and for driving me nuts watching them copy/paste spot lists over and over again in chat.

---

## License

MIT — do whatever you want.

---

<p align="center">
  If this project helps you run smoother races, consider supporting the work:
</p>

<p align="center">
  <a href="https://www.buymeacoffee.com/notfixingit">
    <img src="https://img.shields.io/badge/Buy%20Me%20A%20Coffee-FFDD00?logo=buy-me-a-coffee&logoColor=black" alt="Buy Me A Coffee" />
  </a>
  &nbsp;&nbsp;or&nbsp;&nbsp;
  <a href="https://www.instagram.com/crysis_designs/">
    <strong>sponsor the next wubble</strong> by contacting Crysis Designs on Instagram
  </a>
</p>

---

<p align="center">
  <em>Built with 🧇, maple syrup, and a concerning number of late nights.</em>
</p>
