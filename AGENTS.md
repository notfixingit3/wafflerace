# AGENTS.md — Wafflerace

This document contains critical context for any AI or human contributor working on the Wafflerace project.

## How to Resume After a Reset

When starting a fresh session:

1. Read this entire file first.
2. The canonical asset locations are under `assets/boats/collections/` and `assets/backgrounds/collections/`.
3. All important generated images should already be committed in the repo (in `.../originals/` folders). Do **not** rely on session temp image folders.
4. Use the conversion script (`npm run convert:webp`) when new images are generated.
5. The most important rules are called out in **bold** throughout this document (especially boat direction and visual clamping).

## Current Progress Snapshot (as of v0.1.9)

**Boats**
- Default collection: 50/50 complete
- Flags of US collection: **50/50 COMPLETE** (Alabama → Wyoming)
- Flags of the World (new collection): 5/50 complete — India, China, United States, Indonesia, Pakistan (first batch of top countries)

**Backgrounds**
- Default collection: 20/20 complete
- Nature collection: 5/30 generated (first batch committed)

**Key Recent Architectural & Process Changes**
- Full collections system for boats and backgrounds fully operational
- Boat loader made collection-aware (properly supports named files for themed collections like state/country flags)
- Extremely disciplined asset pipeline now enforced: raw Imagine JPGs → `originals/` → clean transparent PNG → optimized WebP
- Runtime theme switching via `?collection=` and `?bg=` working well
- Background loader made resilient for variable collection sizes

See the detailed backlog below for next priorities.

## Core Mission
Wafflerace is a modern (2026) premium recreation of the popular "duck race" random name picker used by Twitch streamers and for giveaways. It must feel **alive, suspenseful, and high-production** — not like a cheap prototype.

**Non-negotiable rules:**
- The winner must **only** become visually obvious in the final seconds. No boat should appear to reach or cross the finish line early.
- Boats use real AI-generated sprites (50+ variants). Programmer art is no longer acceptable.
- Every commit message **must** end with a random Scooby-Doo quote.
- The experience must feel premium for streaming / OBS use.

## Key Technical Decisions (Current State)

### Frontend (Canvas)
- `web/static/js/race.js` is the heart of the experience.
- Uses 50 right-facing AI boat sprites + 20 background images.
- **Parallax backgrounds**: 3 layers (far/mid/near) at different scroll speeds, randomly selected per race.
- **Visual clamping**: Very strong compression from ~68% of race duration. Leader is kept visually at ~81% until the final 8%, then released sharply.
- **Particles**: Simple syrup drip / splash system.
- **Audio**: Fully synthesized via Web Audio API (water drone + splashes on big surges + win chime). No external audio files.
- **Loading state**: Clean progress bar while 70 assets load.
- **Sprite behavior**: Subtle rocking/tilting + reactive name flags that flutter with movement.

### Backend
- Go + Gin
- Templ + HTMX + Tailwind + DaisyUI
- SQLite persistence (races, participants, results, saved name lists, history)
- API endpoints for race creation, results saving, history, and stats
- Health endpoint at `/health`

### Assets & Collections (Current Physical State)

All generated assets live under these paths (this is the source of truth after any reset):

**Boats**
- `assets/boats/collections/default/` — 50 boats (complete)
  - `webp/` (primary), `png/` (fallback), `originals/`
- `assets/boats/collections/flags-of-us/` — 19/50 states complete (Alabama–Maine)
  - Same subfolder structure as above

**Backgrounds**
- `assets/backgrounds/collections/default/` — 20 backgrounds (complete)
  - `webp/`, `jpg/`
- `assets/backgrounds/collections/nature/` — Empty structure created (30 images planned)

**Important Notes for New Sessions**
- Never rely on images still being in the temporary session folder (`~/.grok/sessions/.../images/`). They must be copied into the `.../originals/` folders inside the collections.
- Use `npm run convert:webp <path-to-png-folder>` after new generations.
- The JavaScript supports runtime selection:
  - Boats: `?collection=flags-of-us`
  - Backgrounds: `?bg=nature` or `?background=default`

See `assets/boat-concepts/README.md` for strict generation rules (especially "**boats must face RIGHT**"). Each collection folder also has its own `README.md` with specific details and a visual gallery.

## Development Workflow

1. Make changes.
2. Test locally (usually via `docker compose up`).
3. Run `go test ./...` and `gosec ./...`.
4. Commit with a Scooby-Doo quote at the end of the message.
5. Push.

## Important History / Lessons

- Boats reaching the right side of the screen before the background or finish line appears is a **critical failure**.
- JPG sprites do not have transparency — this is handled via careful drawing and fallback logic. WebP is now the preferred production format.
- The "feels alive" chaotic jitter (especially in the final phase) is what makes the random winner feel fair and exciting.
- Audio and particles, even when subtle, dramatically increase perceived quality.
- Organizing assets into **collections** (boats + backgrounds) was a major architectural improvement for long-term theming and variety.
- The dramatic winner reveal is one of the highest-ROI areas for making the product feel premium.

## Future Direction & Backlog (as of v0.1.8)

### Testing (High Priority)
- **Backend**:
  - Proper isolation for DB tests using in-memory SQLite (`:memory:` or unique files per test).
  - Comprehensive table-driven tests for all API handlers (`CreateRaceAPI`, `SaveResultAPI`, `GetHistoryAPI`, `GetStatsAPI`).
  - Tests for error paths, validation, and edge cases.
  - Integration-style tests that exercise the full create-race → save-result → history flow.
- **Frontend**:
  - Significantly expand Vitest coverage in `race-logic.js` and extract more pure functions from `race.js` (particle updates, leaderboard logic, pause timing, name formatting, collection loading, etc.).
  - Add tests for the dramatic results reveal logic.
  - Consider Playwright or Cypress for critical E2E flows (create race → run → dramatic results + history persistence + collection switching).
- Add E2E smoke tests for the most important user journeys.

### UI / UX Improvements
- Dramatic, high-production **Results Screen + Winner Reveal** (staged animations, better use of boat sprites, confetti/particles, share buttons) — partially implemented in v0.1.8, needs more polish.
- Full **Theming Engine** (CSS variables + easy switching between visual themes that work with collections).
- Much stronger **History & Analytics** dashboard (filters, search, charts, exports, per-user stats if accounts are added).
- Better **onboarding** and help for first-time users (recommended presets, tooltips, guided setup).
- Mobile / tablet experience pass (thumb-friendly controls, better layout during active race).
- Live "Who's Winning" sidebar improvements + clear toggle.
- Admin / Management surface (view all historical races, delete, basic stats).

### Features & Product
- **Saved Name Lists** stored in the backend (with collection association).
- Light **Public API + outgoing webhooks** on race finish (very useful for streamers).
- **Race Templates** / quick-start bundles.
- Better support for **multiple simultaneous or queued races**.
- Spectator mode enhancements and easy shareable links.

### Architecture & Code Quality
- Further extraction and modularization of `race.js` (rendering, state, controls, audio, particles).
- Consider lightweight state management for the frontend as complexity grows.
- Performance profiling and optimization for 50+ participants.
- Consistent error handling and user-friendly error states across frontend and backend.
- Structured logging and better observability.

### Platform & Ops
- OBS / streaming first-class support (transparent background mode, deep query param control, clean overlay mode).
- User accounts / sessions (so saved lists and history follow the user across devices).
- Better deployment, backup, and migration strategy for SQLite.
- Rate limiting and basic abuse protection on public APIs as usage grows.

### Long-term / Big Bets
- Multi-user / team features.
- Analytics dashboard.
- Integration points with the main Project Syrup application.
- Theming / skin marketplace or easy community contributions for new boat/background collections.

Prioritize based on real usage feedback. Testing (especially frontend + DB isolation) and the dramatic winner reveal are currently among the highest-leverage areas.

## Commit Rule (Enforced)

Every commit message must end with a random Scooby-Doo quote. Example:

```
Add aggressive final-phase jitter and parallax backgrounds

Zoinks! These waffles are really moving now, Scoob!
```

## Security / Quality

- Always run `go test ./...` and `gosec ./...` before releases.
- New Go code (especially in `internal/db` and handlers) should have good test coverage.
- New frontend logic should be extracted into testable pure functions where possible (see `race-logic.js`).
- Frontend changes must preserve the "no early visual winner" invariant and the "boats must face RIGHT" rule for all collections.
- All new boat/background assets must follow the strict rules documented in `assets/boat-concepts/README.md`.

---

*This file should be updated whenever major architectural or experiential decisions are made.*