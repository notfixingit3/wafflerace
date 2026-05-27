# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

## [0.1.12] - 2026-05-??

**This is an infrastructure and sustainability focused release.** The core racing experience remains stable, while the project has received major improvements in containerization, deployment model, release process, and documentation.

Wafflerace 0.1.12 makes the project significantly easier and more professional to run in real environments.

### Highlights
- First-class Docker support with multi-arch images and proper supply chain security.
- Clean "bring your own reverse proxy" deployment model.
- Significantly improved release tooling and contributor experience.

### Added
- Docker images are now first-class citizens:
  - Official images published to GHCR on every release (`ghcr.io/notfixingit3/wafflerace`).
  - Multi-architecture support (linux/amd64 + linux/arm64).
  - Automatic generation of provenance, SBOM, and attestations.
- New `:dev` floating tag published automatically on every push to the `dev` branch (plus `sha-` tags for exact pinning).
- Dedicated GitHub Actions workflow (`docker-dev.yml`) for continuous development image publishing.

### Changed
- **Major deployment model change (breaking for some users)**:
  - Completely removed the bundled Traefik + CrowdSec services from `docker-compose.dev.yml` and `docker-compose.prod.yml`.
  - These files now contain **only** the Wafflerace application + the minimal Traefik labels it needs.
  - Users are now expected to bring their own Traefik (and optionally CrowdSec) setup.
- Release workflow significantly hardened: all `v*` tags must come from the `dev` branch (enforced via real git history checks instead of the unreliable `base_ref` field).
- `docker-compose.dev.yml` and `docker-compose.prod.yml` now clearly document the assumption that users have their own reverse proxy.

### Improved
- Major improvements to Docker publishing pipeline (metadata action, Buildx, layer caching, multi-arch).
- Significantly better documentation around Docker images, deployment options, and the recommended branching + image strategy (`:latest`, `:<version>`, `:dev`).
- Logo size in the main README reduced from 420px to 250px for better visual balance on the page.
- General improvements to CI hygiene and contributor experience.

---

## [0.1.11] - 2026-05-??

### Changed
- Major improvements to release process and CI hygiene.
- Early work on enforcing that releases must come from the `dev` branch.

---

## [0.1.9] - 2026-05-??

### Added
- Full completion of the Flags of US boat collection (50/50 states).
- Launch of the new Flags of the World collection (initial countries).
- Significant improvements to the boat collections loader and system to support named collections.

### Changed
- Much stricter and better documented asset generation pipeline (originals → PNG → WebP).

---

[Unreleased]: https://github.com/notfixingit3/wafflerace/compare/v0.1.11...HEAD
[0.1.11]: https://github.com/notfixingit3/wafflerace/releases/tag/v0.1.11
[0.1.9]: https://github.com/notfixingit3/wafflerace/releases/tag/v0.1.9
