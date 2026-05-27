# Contributing to Wafflerace

Thanks for your interest in contributing! This document outlines how to get involved.

## Code of Conduct

Be respectful and constructive. We're all here to make something fun and useful.

## Getting Started

### Local Development

The easiest way to run the project locally:

```bash
docker compose up -d --build
```

Then visit `http://localhost:9090`.

See `docker-compose.dev.yml` for a Traefik-aware development setup if you already run Traefik locally.

### Project Structure

- `cmd/server/` — Main application entrypoint
- `internal/` — Backend logic (db, handlers, etc.)
- `web/` — Frontend assets and templates
- `assets/` — Boat sprites, backgrounds, and logo files
- `.github/workflows/` — CI and release automation

## Contribution Guidelines

### Commit Messages

**Every commit must end with a random Scooby-Doo quote.**

Examples:
- "Zoinks!"
- "Ruh-roh!"
- "Jinkies!"
- "Scooby-Dooby-Doo!"

This is a project tradition. See [AGENTS.md](AGENTS.md) for more context.

### Pull Requests

- Keep PRs focused. One logical change per PR is ideal.
- Include a clear description of what the change does and why.
- If your change affects user-facing behavior, consider updating the README or relevant docs.
- Make sure the existing tests still pass (`npm test` or `go test ./...` as appropriate).

### Code Style

- Follow existing patterns in the codebase.
- Run formatters/linters when available (`npm run format`, `npm run lint:fix`).
- Keep the core race experience stable. Big changes to timing, visuals, or behavior should be discussed first.

### Testing

We have a growing test suite (especially on the frontend). New logic should ideally come with tests. For frontend changes, look at `web/static/js/race-logic.test.js`.

## Release Process

Releases are created from the `dev` branch only. The release workflow enforces this.

We publish:
- A static binary attached to the GitHub Release
- Multi-arch Docker images to GHCR (`ghcr.io/notfixingit3/wafflerace`)

See the [Docker Images section](README.md#docker-images) in the README for tagging conventions.

## Questions?

Open an issue or start a discussion. We're happy to help you get a contribution over the line.

---

*This project is still relatively small. Clear, well-scoped contributions are very welcome!*
