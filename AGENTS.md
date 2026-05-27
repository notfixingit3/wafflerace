# AGENTS.md — Wafflerace

This document contains critical context for any AI or human contributor working on the Wafflerace project.

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
- No persistence (paste names every time — by design for MVP)
- Health endpoint at `/health`

### Assets
- `assets/boat-concepts/` — 50 right-facing boat sprites (`boat-right-01.jpg` … `50.jpg`)
- `assets/backgrounds/` — 20 syrup river scenes for parallax
- Strict rules for new generations live in `assets/boat-concepts/README.md`

## Development Workflow

1. Make changes.
2. Test locally (usually via `docker compose up`).
3. Run `go test ./...` and `gosec ./...`.
4. Commit with a Scooby-Doo quote at the end of the message.
5. Push.

## Important History / Lessons

- Boats reaching the right side of the screen before the background or finish line appears is a **critical failure**.
- JPG sprites do not have transparency — this is handled via careful drawing and fallback logic.
- The "feels alive" chaotic jitter (especially in the final phase) is what makes the random winner feel fair and exciting.
- Audio and particles, even when subtle, dramatically increase perceived quality.

## Future Direction (as of v0.1.1)

High-value areas that remain:
- Even richer final-phase chaos and audio cues
- Additional background theme packs
- OBS-first features (transparent mode, deep query param support)
- More dramatic animated winner reveal

## Commit Rule (Enforced)

Every commit message must end with a random Scooby-Doo quote. Example:

```
Add aggressive final-phase jitter and parallax backgrounds

Zoinks! These waffles are really moving now, Scoob!
```

## Security / Quality

- Always run `gosec ./...` before release.
- New Go code should have accompanying tests.
- Frontend changes must preserve the "no early visual winner" invariant.

---

*This file should be updated whenever major architectural or experiential decisions are made.*