# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added

### Changed

### Fixed

### Removed


## [0.1.14] - 2026-05-29

**This is a major visual, audio, asset, and E2E testing release.** It brings Wafflerace up to a premium 2026 aesthetic with a stark white developer layout, soft procedural water sound synthesis, improved pacing dynamics, and fully transparent default boat collections.

### Added
- New 2026 Stark White UI design system featuring dot-grid layouts, responsive components, and modern typography details.
- Procedural water splash audio synthesizer in `race-audio.js` combining a low-frequency sine bubble sweep and bandpass-filtered noise.
- Automatic border-based flood-fill transparency processing script.
- 6 newly transparent default boat sprites (PNG/WebP format for `boat-right-12`, `38`, `39`, `43`, `48`, `49`).
- Interactive, animated visual three-step podium (1st, 2nd, 3rd) on the race results screen with transition classes for dynamic slide-up reveals.
- Dedicated canvas (`winner-boat-canvas`) on the gold podium step showing a high-production rendering of the winner's boat sprite.
- Complete E2E journey test suite in `e2e/race-journey.spec.js` covering sequential podium reveals, simulation placement accuracy verification, winner canvas presence, SQLite database history persistence, and spectator mode.
- Comprehensive unit test suite for `ParticleSystem` in `web/static/js/race-particles.test.js` (7 tests covering particle emission, updates, canvas rendering, and confetti).
- Table-driven unit tests for backend API handlers (`CreateRaceAPI`, `SaveResultAPI`, `GetHistoryAPI`, `GetStatsAPI`) in `internal/handlers/race_test.go`.
- Isolated SQLite database helper `SetupTestDBForHandlers` in `internal/db/test_helpers.go` to provide clean in-memory database environments for API handler tests.
- 13 new Vitest test cases in `web/static/js/race-logic.test.js` covering dynamic layout spacing, display name formatting, leaderboard sorting, average progress, and individual waffle physics updates.

### Changed
- Extended camera progression in `race-logic.js` so boats take longer to reach the visual center (arriving at 50% race progress instead of 30%).
- Throttled final-phase splash sounds in `race.js` using a 20% random frame check to prevent annoying rhythmic clicking.
- Refactored `showResults()` in `web/static/js/race.js` to execute sequential reveals (3rd place -> 2nd place -> 1st place + winner name/announcement/confetti/finish chime) over 600ms timed intervals.
- Retained the final results card for standings of 4th place and below under "Rest of the Field" to avoid visual redundancy.
- Updated `runAgainWithSameNames()` in `web/static/js/race.js` to reset the podium styling classes and clear the winner's canvas context for clean consecutive races.
- Modularized the core canvas runner `race.js` by extracting and refactoring layout, leaderboard sorting, formatting, and waffle position calculations into `race-logic.js` as pure functions.
- Decoupled `race.js` logic by split-importing modular files `race-audio.js` and `race-particles.js` as ES modules.
- Optimized canvas update loop performance by calculating average waffle progress once per frame instead of inside the waffle iteration loop.

### Removed
- Legacy static boilerplate file `web/static/index.html` (rendered obsolete by backend Templ/Go Gin).
- Obsolete draft logo asset variations (`logo-alt.png`, `logo-old.png`, `logo-source-v2.png`, etc.) under the `assets/` directory.
- Obsolete wrong-direction boat concept images under `assets/boat-concepts/old-wrong-direction/`.
- Untracked obsolete release plan `RELEASE-PLAN-0.1.12.md`.


## [0.1.13] - 2026-05-??

**This is a focused frontend testing and hardening release.** The core racing experience is unchanged, but the most critical user entry point — the race creation flow — has been comprehensively extracted, unit tested, and E2E tested. A real production bug was discovered and fixed as a direct result of the new test coverage.

This release directly executes the top-priority frontend testing items from the project backlog (AGENTS.md).

### Highlights
- 9 key race creation functions extracted from inline template script into a proper, testable ESM module (`race-logic.js`).
- 31 Vitest unit tests covering the entire creation path (validation, payload building, API orchestration, form handling, redirect URL construction).
- 6 Playwright E2E tests exercising the full browser flow including collections, special characters, presets, and the "Test Race" button.
- Critical production bug fixed: missing `type="module"` on the race-logic.js script tag was causing "Unexpected token 'export'" on every race page after creation. Discovered via E2E.
- The race creation process (the exact area flagged as suspicious) is now the best-tested and most reliable part of the frontend.

### Added
- New `web/static/js/race-logic.test.js` (31 tests).
- New `e2e/race-creation.spec.js` (6 tests) + `playwright.config.js` (auto-starting server on port 9090).
- `RELEASE-PLAN-0.1.13.md` documenting the full scope and rationale.

### Changed
- `web/static/js/race-logic.js` now contains the complete, exported race creation logic (parseNames through submitRaceCreation, plus fillTestNames/setDuration with window fallbacks).
- `internal/templates/pages/setup.templ` submit handler reduced from ~40 lines of inline logic to a tiny 8-line listener that delegates to the extracted functions.
- `internal/templates/pages/race.templ` now correctly loads race-logic.js as an ES module (the bugfix).

### Fixed
- Race page completely broken after creation redirect due to ESM module loading error. The new E2E layer paid for itself on the first real run.

---

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

[Unreleased]: https://github.com/notfixingit3/wafflerace/compare/v0.1.14...HEAD
[0.1.14]: https://github.com/notfixingit3/wafflerace/compare/v0.1.13...v0.1.14
[0.1.13]: https://github.com/notfixingit3/wafflerace/compare/v0.1.12...v0.1.13
[0.1.12]: https://github.com/notfixingit3/wafflerace/releases/tag/v0.1.12
[0.1.11]: https://github.com/notfixingit3/wafflerace/releases/tag/v0.1.11
[0.1.9]: https://github.com/notfixingit3/wafflerace/releases/tag/v0.1.9
