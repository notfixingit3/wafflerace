# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added
- Docker images are now published to GitHub Container Registry (GHCR) on every release.
  - Multi-arch support (linux/amd64 + linux/arm64)
  - Automatic provenance, SBOM, and attestations
- New `:dev` image tag published on every push to the `dev` branch (with smart filtering to avoid unnecessary rebuilds on docs-only changes).
- `sha-` tags for exact commit pinning of dev images.

### Changed
- **Breaking for previous users of the bundled proxy setup**: 
  - Removed the bundled Traefik + CrowdSec services from `docker-compose.dev.yml` and `docker-compose.prod.yml`.
  - These files now contain **only** the application service + the Traefik labels it needs.
  - Users are now expected to run Wafflerace behind their own existing Traefik (and optionally CrowdSec) instance.
- Release workflow now strictly enforces that all `v*` tags must originate from the `dev` branch using real git history checks.

### Improved
- Significantly improved Docker publishing pipeline with proper metadata, caching, and supply-chain security features.
- Better documentation around Docker usage, image tags, and deployment options.
- Logo size in the README reduced for better visual balance.

---

## [0.1.11] - 2026-05-?? (Previous release)

### Changed
- Major improvements to release process and CI hygiene.
- Work on enforcing releases come only from the `dev` branch.

---

## [0.1.9] - 2026-05-??

### Added
- Full completion of the Flags of US boat collection (50/50).
- Launch of the new Flags of the World collection (first 5 countries).
- Significant improvements to the boat collections system and loader.

### Changed
- Much stricter and documented asset generation pipeline.

---

[Unreleased]: https://github.com/notfixingit3/wafflerace/compare/v0.1.11...HEAD
[0.1.11]: https://github.com/notfixingit3/wafflerace/releases/tag/v0.1.11
[0.1.9]: https://github.com/notfixingit3/wafflerace/releases/tag/v0.1.9
