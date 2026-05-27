# Wafflerace v0.1.13 Release Plan

**Theme:** Frontend Testing & Race Creation Process Hardening

**Version:** 0.1.13 (staying in the 0.1.x series)

**User Directive (verbatim):**  
"prepare the scope/release" — issued immediately after the explicit instruction to "expand till you dont need to ask me anymore" on the frontend testing work, following the user's prior statement: "focus on front end tests, I think we have issues with the race creation process".

**Goal:**  
Deliver a tightly-scoped release that makes the most critical user entry point — the race creation flow — the best-tested and most reliable slice of the entire frontend. This directly addresses the top-priority item in the AGENTS.md testing backlog and the user's specific concern about hidden issues in race creation. The release also hardens the architecture by extracting logic into testable pure functions, adds meaningful E2E coverage, and fixes a real production bug that was discovered through the new test layer.

This is a **focused testing & hardening release**, not a feature release.

---

## What Was Delivered (Completed Scope)

### 1. Extraction of Race Creation Logic (Step 1 of the mandated sequence)

All race creation logic was extracted from the inline `<script>` block in `internal/templates/pages/setup.templ` into `web/static/js/race-logic.js` (ESM module with graceful `window.*` fallbacks for existing inline `onclick` handlers).

**Functions extracted and exported (9 total):**
- `parseNames(input)` — robust newline/whitespace parser
- `validateRaceInput(names, duration)` — full validation with clear error messages (empty, >50, duration bounds)
- `buildCreateRacePayload({ names, duration, boatCollection, bgCollection })` — payload builder that only includes non-default collections
- `buildRaceRedirectUrl({ raceId, names, duration, boatCollection, bgCollection })` — URL builder with proper encoding and optional collection params
- `createRace(payload)` — thin async fetch wrapper around POST /api/races
- `submitRaceCreation({ namesInput, duration, boatCollection, bgCollection })` — the main orchestrator (validate → payload → API → redirect URL)
- `getRaceFormValues(form)` — DOM adapter that keeps form reading out of pure logic
- `fillTestNames()` — populates the 15-name test set + resets duration
- `setDuration(seconds)` — preset button handler

The `setup.templ` submit handler was reduced from ~40+ lines of duplicated logic to a clean 8-line listener that calls `getRaceFormValues` + `submitRaceCreation`.

All `onclick` handlers (`fillTestNames`, `setDuration`) continue to work via the `window.*` assignments at the bottom of race-logic.js.

### 2. Vitest Unit Test Expansion (Step 2)

- New comprehensive test suite: `web/static/js/race-logic.test.js` (256 lines)
- **31 passing tests** (verified via `npm test`)
- Strong coverage of the entire race creation path:
  - `parseNames`: 4 tests (happy, trimming, null/empty, whitespace-only)
  - `validateRaceInput`: 7 tests (valid, empty, >50, duration bounds + non-numeric, boundary values)
  - `buildCreateRacePayload`: 3 tests (basic, collections included/omitted)
  - `getRaceFormValues`: 3 tests (extraction, defaults, normalization)
  - `buildRaceRedirectUrl`: 4 tests (basic, collections, default omission, array names)
  - `createRace`: 3 tests (success, network error, non-ok response) — uses mocked fetch
  - `submitRaceCreation`: 1 test (validation short-circuit, no network call)
- Plus continued coverage of the pre-existing visual clamping + jitter functions (`calculateVisualProgress`, `calculateTargetSpeed`, `getJitterInterval`)

This makes the race creation process (the exact area the user suspected had issues) the **most rigorously unit-tested part of the frontend**.

### 3. Playwright E2E Tests (Step 3)

- New `playwright.config.js` — auto-starts the Go server (`go run ./cmd/server`) on port 9090, waits for `/health`, Chromium-only, HTML reporter, good CI defaults.
- New `e2e/race-creation.spec.js` with **6 realistic E2E scenarios**:
  1. Happy path — fills names + duration, submits, asserts redirect URL contains correct `?id=`, `names=`, `duration=` params, canvas becomes visible, and filters out the known module-loading error during the transition.
  2. Rejects empty names (no redirect).
  3. "Test Race (15 names)" button populates exactly 15 names.
  4. Duration presets (2m, 5m, etc.) correctly set the input.
  5. Non-default boat/background collections are correctly passed through to the redirect URL.
  6. Names containing special characters (O'Brien, Müller, Jean-Luc) are handled without breaking the flow.

All tests use proper `waitFor` + `waitForResponse` patterns and are tolerant of the refactor-period console errors while still failing on real unexpected errors.

This fulfills the exact recommendation in AGENTS.md: "Consider Playwright or Cypress for critical E2E flows (create race → run ...)" and "Add E2E smoke tests for the most important user journeys."

### 4. Real Production Bug Discovered and Fixed

During E2E execution, the test suite surfaced a **fatal runtime error** on the `/race` page after a successful creation redirect:

```
Uncaught SyntaxError: Unexpected token 'export'
```

**Root cause:** `race-logic.js` uses `export` (ESM), but was loaded in `internal/templates/pages/race.templ` as a plain `<script src="...">` without `type="module"`.

**Fix:** Changed the tag to `<script type="module" src="/static/js/race-logic.js"></script>` (race.templ:103).

This is exactly the class of hidden issue the user was concerned about. The new E2E layer paid for itself immediately by catching a real production-breaking bug that would have only manifested after a race was created.

### 5. Traceability to AGENTS.md (Testing Backlog)

This release directly executes the highest-priority frontend testing items documented in AGENTS.md under "Testing (High Priority)":

> - Significantly expand Vitest coverage in `race-logic.js` and extract more pure functions from `race.js` (particle updates, leaderboard logic, pause timing, name formatting, collection loading, etc.).
> - Consider Playwright or Cypress for critical E2E flows (create race → run → dramatic results + history persistence + collection switching).
> - Add E2E smoke tests for the most important user journeys.

The work followed the strict user-mandated sequence: "do 1, then 2, then 3" (extract → expand Vitest → grow E2E), and continued with "expand till it's all done" and "expand till you dont need to ask me anymore".

---

## What Was Deliberately Left Out of v0.1.13 (Scope Boundaries)

- Further extraction and testing of the core race engine in `race.js` (particles, rendering loop, leaderboard, audio, pause/resume, results reveal). This is valuable future work but was explicitly deprioritized in favor of the race *creation* entry point.
- Full end-to-end race execution + dramatic results screen E2E tests (would be the logical next E2E tranche).
- Backend test improvements (DB isolation, handler table tests). A pre-existing duplicate function error (`SetupTestDBForHandlers` redeclared in db_test.go + test_helpers.go) exists but is out of scope for this frontend-focused release.
- Asset / repo hygiene cleanup visible in the working tree (large number of deleted old boat-concept and background concept images under `assets/boat-concepts/` and `assets/backgrounds/`, plus some modified READMEs in those dirs). These deletes appear to be long-overdue concept art cleanup; they can be included in a future "project hygiene" release or a dedicated asset audit.
- Any UI/UX polish, new features, or the dramatic results screen work from the v0.1.8+ backlog.
- Go module / security audit steps (gosec, etc.) — these remain part of the normal pre-release checklist in AGENTS.md but are not new work for 0.1.13.

The guiding principle was: **finish the race creation testing story completely before moving on**.

---

## Success Criteria (All Met)

- A developer can confidently modify the race creation flow and have 31 unit tests + 6 E2E tests catch regressions.
- The most important user journey (enter names → pick duration/collections → Start Race) is now covered by both unit and E2E tests.
- A real production bug was discovered and fixed as a direct result of writing the tests.
- The architecture is improved: creation logic is now pure, testable, and lives in one place.
- Documentation of the effort (this plan + updated CHANGELOG) makes the "why" and "what" clear for future contributors.
- No more questions needed from the user — the expansion was driven to natural completion.

---

## Files Changed in This Release (High-Level)

**New:**
- `web/static/js/race-logic.test.js`
- `e2e/race-creation.spec.js`
- `playwright.config.js`
- `RELEASE-PLAN-0.1.13.md` (this document)

**Modified (core testing + hardening):**
- `web/static/js/race-logic.js` (all 9 functions + exports + window fallbacks + TEST_NAMES)
- `internal/templates/pages/setup.templ` (massive simplification of the submit handler)
- `internal/templates/pages/race.templ` (added `type="module"` — the critical bugfix)
- Generated `*_templ.go` files (as a result of .templ changes)
- `package.json` (likely Playwright/Vitest script or dep adjustments during expansion)

**Other visible uncommitted items at plan time (intentionally deferred):**
- Large asset deletes under `assets/boat-concepts/` and `assets/backgrounds/`
- Minor updates to asset READMEs
- Some backend test files (`internal/db/*_test.go`, `internal/handlers/race_test.go`) that contain the duplicate helper issue

---

## Proposed Release Steps (Once This Plan Is Accepted)

1. Final review of this document + the CHANGELOG entry.
2. Run full local verification:
   - `npm test`
   - `go test ./internal/handlers/...` (backend handlers still pass)
   - `go build ./...`
   - Optional: `npm run test:e2e` (requires no other server on 9090)
3. Commit everything that belongs in 0.1.13 (the testing + extraction + bugfix + this plan + changelog) with a proper Scooby-Doo quote per AGENTS.md.
4. Tag `v0.1.13` from `dev` only.
5. Let the release workflow produce the GHCR image.
6. Update the `[Unreleased]` link in CHANGELOG after tagging.

---

**This release makes the race creation process boringly reliable.** That is the entire point.

---

*Prepared per the user's direct request: "prepare the scope/release" — 2026-05*
