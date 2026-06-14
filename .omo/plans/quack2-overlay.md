# Quack 2.0 - Real-time 3D Multiplayer Stream Overlay

## TL;DR

> **Quick Summary**: Build a real-time 3D duck-race stream overlay with a Go authoritative game engine and a Next.js/Three.js frontend, deployable via Docker Compose.
>
> **Deliverables**:
> - `/quack2/backend/` — Go WebSocket game server (10Hz tick, duck physics, boosts, winner detection)
> - `/quack2/frontend/` — Next.js app with `/` control panel and `/overlay` 3D renderer
> - `docker-compose.yml` — builds and runs both services
> - Backend and frontend test suites
>
> **Estimated Effort**: Large
> **Parallel Execution**: YES — 4 implementation waves + final review wave
> **Critical Path**: Task 1 → Task 8 → Task 13 → Task 15 → Task 19 → Task 21 → Task 25 → F1-F4 → user okay

---

## Context

### Original Request
Build "Quack 2.0" — a modernized Twitch Duck Race — as a web-first, real-time 3D multiplayer stream overlay. The Go backend is the authoritative game engine; the Next.js + Three.js frontend is a dumb renderer. Both run in Docker Compose.

### Interview Summary
**Key Discussions**:
- Project lives in nested `/quack2/` directory inside current workspace
- Backend: Go 1.22+, Gorilla WebSockets, 10Hz tick, linear Z-axis river
- Frontend: Next.js TypeScript + @react-three/fiber + @react-three/drei
- TDD: `go test` backend, `vitest` + RTL frontend
- Visuals: colored spheres + floating name labels, low-poly/cartoon style
- Control panel: start/pause/reset, spawn/remove ducks, show overlay URL
- Mock chat: deterministic seed, `!boost` gives +50% velocity for 3 seconds (refreshable)
- Finish condition: first duck past finish line wins, race pauses, winner banner, reset restarts

**Research Findings**:
- Current workspace has no application code; greenfield build
- No SDD framework detected

### Metis Review
**Identified Gaps** (addressed):
- Finish condition undefined → decided: first to finish wins
- Boost mechanic undefined → decided: +50% for 3s, refreshable
- Test strategy vague → decided: TDD with go test + vitest
- Duplicate scope sections → cleaned up
- Added single-sentence core objective

### High Accuracy Review (Momus)
- **Mode selected**: High accuracy review requested by user
- **Reviewer**: Momus - Plan Critic
- **Verdict**: **OKAY**
- **Scope of review**: Executability, reference validity, QA scenario completeness, internal consistency
- **Findings**: No blocking issues. All 25 implementation tasks have clear instructions, concrete acceptance criteria, and executable QA scenarios. Dependency matrix and parallel waves are logically organized. Plan is ready for execution.

---

## Work Objectives

### Core Objective
Build a real-time 3D duck-race stream overlay with a Go authoritative game engine and a Next.js/Three.js frontend, deployable via Docker Compose.

### Concrete Deliverables
- `quack2/backend/cmd/main.go`
- `quack2/backend/internal/game/` (tick loop, duck state, movement, boosts, winner detection)
- `quack2/backend/internal/hub/` (WebSocket clients, broadcasting, control messages)
- `quack2/backend/internal/chat/` (deterministic mock IRC listener)
- `quack2/backend/Dockerfile`
- `quack2/frontend/src/app/page.tsx` (control panel)
- `quack2/frontend/src/app/overlay/page.tsx`
- `quack2/frontend/src/components/canvas/` (River, Duck, Scene, Camera)
- `quack2/frontend/src/components/ui/` (ControlPanel buttons)
- `quack2/frontend/src/hooks/useRaceSocket.ts`
- `quack2/frontend/Dockerfile`
- `quack2/docker-compose.yml`
- Backend and frontend test files

### Definition of Done
- [ ] `docker compose up` starts both services without errors
- [ ] `curl http://localhost:8080/health` returns 200
- [ ] Frontend `/overlay` renders moving ducks at server coordinates
- [ ] Control panel `/` can spawn ducks, start/pause/reset race
- [ ] Mock chat boosts are deterministic and visible in telemetry
- [ ] Winner detection pauses race and shows winner banner
- [ ] All tests pass

### Must Have
- Go backend is the single source of truth for duck positions
- 10Hz server tick broadcasting JSON duck-state array
- WebSocket connection from frontend to backend
- 3D spheres rendered at exact server coordinates
- Client-side interpolation for 60FPS smoothness
- Docker Compose runs both services on ports 3000 and 8080
- Deterministic mock chat with seeded `!boost`
- Winner detection and pause on finish

### Must NOT Have (Guardrails)
- No physics calculations in the browser
- No real Twitch IRC integration
- No authentication or authorization
- No database or persistence
- No obstacles, collisions, or non-linear tracks
- No REST API for controls (WebSocket only)
- No audio, particle effects, or custom 3D duck models
- No responsive/mobile overlay layout
- No HTTPS/WSS in local Docker Compose
- No stateful UI in overlay route

---

## Verification Strategy

> **ZERO HUMAN INTERVENTION** - ALL verification is agent-executed. No exceptions.

### Test Decision
- **Infrastructure exists**: NO (greenfield — test infrastructure must be created)
- **Automated tests**: TDD
- **Backend framework**: `go test`
- **Frontend framework**: `vitest` + `@testing-library/react`, run via `bun test` or `npm test`
- **If TDD**: Each task follows RED (failing test) → GREEN (minimal impl) → REFACTOR

### QA Policy
Every task MUST include agent-executed QA scenarios. Evidence saved to `.omo/evidence/task-{N}-{scenario-slug}.{ext}`.

- **Frontend/UI**: Use Playwright — navigate, interact, assert DOM, screenshot
- **API/Backend**: Use Bash (`curl`, `websocat`) — send requests, assert status + response fields
- **Library/Module**: Use Bash (`go test`, `bun test`) — run tests, assert PASS
- **Docker**: Use Bash (`docker compose`) — build, run, health-check

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Foundation + contracts):
├── 1. Project scaffolding and module setup
├── 2. Duck model and JSON serialization tests
├── 3. Game engine tick/movement tests
├── 4. Boost mechanic tests
├── 5. Winner detection tests
├── 6. WebSocket hub contract tests
└── 7. Mock chat listener tests

Wave 2 (Backend implementation):
├── 8. Implement game engine (depends: 2, 3)
├── 9. Implement boost mechanic (depends: 4)
├── 10. Implement winner detection (depends: 5)
├── 11. Implement WebSocket hub (depends: 6)
├── 12. Implement mock chat listener (depends: 7)
├── 13. Wire main.go server (depends: 8, 9, 10, 11, 12)
└── 14. Frontend project setup and deps

Wave 3 (Frontend implementation):
├── 15. WebSocket hook/context (depends: 14)
├── 16. Duck renderer component (depends: 14)
├── 17. River component (depends: 14)
├── 18. Scene and camera setup (depends: 14)
├── 19. Overlay page (depends: 15, 16, 17, 18)
├── 20. Control panel page (depends: 15)
└── 21. Client-side interpolation (depends: 15, 16)

Wave 4 (Docker + integration):
├── 22. Backend Dockerfile (depends: 13)
├── 23. Frontend Dockerfile (depends: 19, 20)
├── 24. docker-compose.yml (depends: 22, 23)
└── 25. End-to-end integration smoke test (depends: 24)

Wave FINAL (Reviews):
├── F1. Plan compliance audit (oracle)
├── F2. Code quality review (unspecified-high)
├── F3. Real manual QA (unspecified-high)
└── F4. Scope fidelity check (deep)
-> Present results -> Get explicit user okay

Critical Path: 1 → 8 → 13 → 15 → 19 → 21 → 25 → F1-F4 → user okay
```

### Dependency Matrix

| Task | Blocked By | Blocks |
|------|-----------|--------|
| 1 | - | 2-7, 14 |
| 2 | 1 | 8 |
| 3 | 1 | 8 |
| 4 | 1 | 9 |
| 5 | 1 | 10 |
| 6 | 1 | 11 |
| 7 | 1 | 12 |
| 8 | 2, 3 | 13 |
| 9 | 4 | 13 |
| 10 | 5 | 13 |
| 11 | 6 | 13 |
| 12 | 7 | 13 |
| 13 | 8-12 | 24, 25 |
| 14 | 1 | 15-18 |
| 15 | 14 | 19, 20, 21 |
| 16 | 14 | 19 |
| 17 | 14 | 19 |
| 18 | 14 | 19 |
| 19 | 15-18 | 23, 25 |
| 20 | 15 | 23 |
| 21 | 15, 16 | 25 |
| 22 | 13 | 24 |
| 23 | 19, 20 | 24 |
| 24 | 22, 23 | 25 |
| 25 | 13, 19, 21, 24 | F3 |
| F1-F4 | 25 | user okay |

### Agent Dispatch Summary

- **Wave 1**: 7 tasks → `quick`
- **Wave 2**: 6 tasks → `unspecified-high` (backend logic) + `quick` (setup)
- **Wave 3**: 7 tasks → `visual-engineering` + `quick`
- **Wave 4**: 4 tasks → `quick` + `unspecified-high`
- **FINAL**: 4 tasks → `oracle`, `unspecified-high`, `unspecified-high`, `deep`

---

## TODOs

- [x] 1. Project scaffolding and module setup

  **What to do**:
  - Create `/quack2/` directory inside current workspace
  - Create Go module `github.com/wafflerace/quack2/backend` in `quack2/backend/go.mod`
  - Create Next.js app `quack2-frontend` in `quack2/frontend/package.json`
  - Add shared root `.gitignore` for Go, Node, Docker, and `.omo/evidence/`
  - Add backend folder structure: `cmd/`, `internal/game/`, `internal/hub/`, `internal/chat/`
  - Add frontend folder structure: `src/app/`, `src/components/canvas/`, `src/components/ui/`, `src/hooks/`

  **Must NOT do**:
  - Do not write any application logic in this task (only scaffolding)
  - Do not commit `.omo/` or `node_modules/`

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Reason**: File creation, module initialization, and config setup only

  **Parallelization**:
  - **Can Run In Parallel**: NO (foundational scaffolding)
  - **Parallel Group**: Wave 1 (with Tasks 2-7)
  - **Blocks**: Tasks 2-7, 14
  - **Blocked By**: None

  **References**:
  - Go modules: https://go.dev/ref/mod
  - Next.js TypeScript setup: https://nextjs.org/docs/app/building-your-application/configuring/typescript

  **Acceptance Criteria**:
  - [ ] `quack2/backend/go.mod` exists with module path `github.com/wafflerace/quack2/backend`
  - [ ] `quack2/frontend/package.json` exists with name `quack2-frontend`
  - [ ] All required directories exist
  - [ ] `git status` shows only new files in `quack2/`

  **QA Scenarios**:
  ```
  Scenario: Verify directory structure
    Tool: Bash
    Steps:
      1. ls quack2/backend/cmd quack2/backend/internal/game quack2/backend/internal/hub quack2/backend/internal/chat
      2. ls quack2/frontend/src/app quack2/frontend/src/components/canvas quack2/frontend/src/components/ui quack2/frontend/src/hooks
    Expected Result: All directories exist
    Evidence: .omo/evidence/task-1-structure.png
  ```

  **Commit**: YES
  - Message: `chore(repo): scaffold quack2 monorepo structure`
  - Files: `quack2/**`

- [x] 2. Duck model and JSON serialization tests

  **What to do**:
  - Define `Duck` struct in `internal/game/duck.go` with fields: ID, Name, X, Y, Z, Velocity, Color, ActiveBoostUntil
  - Define JSON serialization for duck-state broadcast
  - Write tests in `internal/game/duck_test.go` covering marshaling/unmarshaling, zero values, and boost timestamp handling

  **Must NOT do**:
  - Do not implement movement or boost logic yet
  - Do not add database tags or persistence concerns

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Reason**: Pure data modeling and unit tests

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1
  - **Blocks**: Task 8
  - **Blocked By**: Task 1

  **Acceptance Criteria**:
  - [ ] `go test ./internal/game` passes with ≥3 test cases
  - [ ] JSON output contains exactly: `id`, `name`, `x`, `y`, `z`, `velocity`, `color`

  **QA Scenarios**:
  ```
  Scenario: Duck serialization round-trip
    Tool: Bash
    Steps:
      1. cd quack2/backend
      2. go test ./internal/game -run TestDuckMarshal -v
    Expected Result: PASS, JSON fields match expected
    Evidence: .omo/evidence/task-2-serialize.txt
  ```

  **Commit**: YES
  - Message: `test(backend): add duck model and serialization tests`

- [x] 3. Game engine tick and movement tests

  **What to do**:
  - Design the game engine API: `NewEngine(config)`, `Engine.Tick()`, `Engine.Ducks()`
  - Write tests in `internal/game/engine_test.go`:
    - Ducks move down Z at base speed each tick
    - X and Y remain constant
    - Pause prevents movement
    - Reset returns ducks to start

  **Must NOT do**:
  - Do not implement the engine yet
  - Do not add winner logic yet

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Reason**: API design + TDD contracts

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1
  - **Blocks**: Task 8
  - **Blocked By**: Task 1

  **Acceptance Criteria**:
  - [ ] `go test ./internal/game` passes (tests will be RED until Task 8)
  - [ ] Test file compiles and defines expected behavior

  **QA Scenarios**:
  ```
  Scenario: Verify engine tests exist and describe movement
    Tool: Bash
    Steps:
      1. cd quack2/backend
      2. go test ./internal/game -run TestEngineTick -v
    Expected Result: Tests fail (RED state) with clear assertion messages
    Evidence: .omo/evidence/task-3-red-tests.txt
  ```

  **Commit**: YES
  - Message: `test(backend): add game engine tick and movement tests`

- [x] 4. Boost mechanic tests

  **What to do**:
  - Design boost API: `Engine.Boost(duckID)`, `Duck.Boosted(until time.Time)`
  - Write tests in `internal/game/boost_test.go`:
    - Boost increases velocity by 50% for 3 seconds
    - Multiple boosts refresh duration
    - Boost expires after duration

  **Must NOT do**:
  - Do not implement boost logic yet

  **Recommended Agent Profile**:
  - **Category**: `quick`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1
  - **Blocks**: Task 9
  - **Blocked By**: Task 1

  **Acceptance Criteria**:
  - [ ] `go test ./internal/game` runs boost tests (RED until Task 9)
  - [ ] Tests assert exact velocity multiplier and duration

  **QA Scenarios**:
  ```
  Scenario: Boost test RED state
    Tool: Bash
    Steps:
      1. cd quack2/backend
      2. go test ./internal/game -run TestBoost -v
    Expected Result: FAIL with clear expected vs actual
    Evidence: .omo/evidence/task-4-boost-red.txt
  ```

  **Commit**: YES
  - Message: `test(backend): add boost mechanic tests`

- [x] 5. Winner detection tests

  **What to do**:
  - Design winner API: `Engine.Winner()`, `Engine.Finished()`, `Engine.ResetRace()`
  - Write tests in `internal/game/winner_test.go`:
    - First duck crossing Z=200 wins
    - Race state becomes "finished"
    - Reset clears winner

  **Must NOT do**:
  - Do not implement winner logic yet

  **Recommended Agent Profile**:
  - **Category**: `quick`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1
  - **Blocks**: Task 10
  - **Blocked By**: Task 1

  **Acceptance Criteria**:
  - [ ] `go test ./internal/game` runs winner tests (RED until Task 10)
  - [ ] Tests assert finish-line Z and winner ID

  **QA Scenarios**:
  ```
  Scenario: Winner test RED state
    Tool: Bash
    Steps:
      1. cd quack2/backend
      2. go test ./internal/game -run TestWinner -v
    Expected Result: FAIL with clear expected vs actual
    Evidence: .omo/evidence/task-5-winner-red.txt
  ```

  **Commit**: YES
  - Message: `test(backend): add winner detection tests`

- [x] 6. WebSocket hub contract tests

  **What to do**:
  - Design hub API: `NewHub()`, `Hub.Run()`, `Hub.Register(conn)`, `Hub.Broadcast(state)`
  - Write tests in `internal/hub/hub_test.go`:
    - Client connects and receives broadcast
    - Multiple clients receive same message
    - Client disconnect is handled cleanly

  **Must NOT do**:
  - Do not implement the hub yet
  - Do not add HTTP upgrade logic yet

  **Recommended Agent Profile**:
  - **Category**: `quick`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1
  - **Blocks**: Task 11
  - **Blocked By**: Task 1

  **Acceptance Criteria**:
  - [ ] `go test ./internal/hub` runs (RED until Task 11)
  - [ ] Tests use `github.com/gorilla/websocket` test helpers

  **QA Scenarios**:
  ```
  Scenario: Hub test RED state
    Tool: Bash
    Steps:
      1. cd quack2/backend
      2. go test ./internal/hub -v
    Expected Result: FAIL or compile error (expected)
    Evidence: .omo/evidence/task-6-hub-red.txt
  ```

  **Commit**: YES
  - Message: `test(backend): add WebSocket hub contract tests`

- [x] 7. Mock chat listener tests

  **What to do**:
  - Design chat API: `NewMockChat(seed int64, out chan<- ChatCommand)`, deterministic command generation
  - Write tests in `internal/chat/chat_test.go`:
    - Same seed produces same sequence
    - Commands include `!boost` with target duck name
    - Listener can be stopped cleanly

  **Must NOT do**:
  - Do not implement listener yet
  - Do not connect to engine yet

  **Recommended Agent Profile**:
  - **Category**: `quick`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1
  - **Blocks**: Task 12
  - **Blocked By**: Task 1

  **Acceptance Criteria**:
  - [ ] `go test ./internal/chat` runs (RED until Task 12)
  - [ ] Tests assert deterministic sequence for same seed

  **QA Scenarios**:
  ```
  Scenario: Chat test RED state
    Tool: Bash
    Steps:
      1. cd quack2/backend
      2. go test ./internal/chat -v
    Expected Result: FAIL or compile error (expected)
    Evidence: .omo/evidence/task-7-chat-red.txt
  ```

  **Commit**: YES
  - Message: `test(backend): add mock chat listener tests`

- [x] 8. Implement game engine (tick loop and movement)

  **What to do**:
  - Implement `Engine` in `internal/game/engine.go`
  - 10Hz tick loop with configurable interval (100ms)
  - Maintain `map[string]*Duck` with mutex protection
  - `AddDuck`, `RemoveDuck`, `Start`, `Pause`, `Reset` methods
  - Ducks move `velocity * dt` down Z axis
  - X positions spread evenly across river width (-20 to +20)

  **Must NOT do**:
  - Do not add boost logic (Task 9)
  - Do not add winner logic (Task 10)
  - Do not add WebSocket code

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Reason**: Core backend logic requiring correctness and concurrency safety

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 9-12)
  - **Parallel Group**: Wave 2
  - **Blocks**: Task 13
  - **Blocked By**: Tasks 2, 3

  **Acceptance Criteria**:
  - [ ] `go test ./internal/game -run TestEngine` passes
  - [ ] `go test ./internal/game -run TestDuckMarshal` still passes

  **QA Scenarios**:
  ```
  Scenario: Engine movement over time
    Tool: Bash
    Steps:
      1. cd quack2/backend
      2. go test ./internal/game -run TestEngineTick -v
    Expected Result: PASS
    Evidence: .omo/evidence/task-8-engine-move.txt
  ```

  **Commit**: YES
  - Message: `feat(backend): implement game engine tick loop and movement`

- [x] 9. Implement boost mechanic

  **What to do**:
  - Implement `Engine.Boost(duckID string)` in `internal/game/boost.go` or `engine.go`
  - Store `ActiveBoostUntil` on Duck
  - During tick, if `now < ActiveBoostUntil`, velocity = base * 1.5
  - Multiple boosts extend `ActiveBoostUntil` by 3 seconds from now

  **Must NOT do**:
  - Do not change winner logic
  - Do not expose boost directly via HTTP

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: Task 13
  - **Blocked By**: Task 4

  **Acceptance Criteria**:
  - [ ] `go test ./internal/game -run TestBoost` passes

  **QA Scenarios**:
  ```
  Scenario: Boost increases velocity
    Tool: Bash
    Steps:
      1. cd quack2/backend
      2. go test ./internal/game -run TestBoost -v
    Expected Result: PASS
    Evidence: .omo/evidence/task-9-boost.txt
  ```

  **Commit**: YES
  - Message: `feat(backend): implement boost mechanic`

- [x] 10. Implement winner detection

  **What to do**:
  - Implement finish-line detection in `internal/game/winner.go` or `engine.go`
  - Finish line at Z = 200
  - On first crossing, set race state to `finished`, record winner
  - Pause tick updates when finished
  - `Reset` clears winner and returns ducks to start

  **Must NOT do**:
  - Do not add banner UI (frontend Task 19)
  - Do not persist winner history

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: Task 13
  - **Blocked By**: Task 5

  **Acceptance Criteria**:
  - [ ] `go test ./internal/game -run TestWinner` passes

  **QA Scenarios**:
  ```
  Scenario: Winner detection
    Tool: Bash
    Steps:
      1. cd quack2/backend
      2. go test ./internal/game -run TestWinner -v
    Expected Result: PASS
    Evidence: .omo/evidence/task-10-winner.txt
  ```

  **Commit**: YES
  - Message: `feat(backend): implement winner detection`

- [x] 11. Implement WebSocket hub

  **What to do**:
  - Implement `Hub` in `internal/hub/hub.go`
  - Register/unregister clients with channels
  - Broadcast JSON duck-state array to all clients on each tick
  - Handle control messages from clients: `spawn`, `remove`, `start`, `pause`, `reset`
  - Use `github.com/gorilla/websocket`

  **Must NOT do**:
  - Do not start the HTTP server here
  - Do not implement chat listener here

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Reason**: Concurrent networking code

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: Task 13
  - **Blocked By**: Task 6

  **Acceptance Criteria**:
  - [ ] `go test ./internal/hub` passes
  - [ ] Hub broadcasts valid JSON to two test clients

  **QA Scenarios**:
  ```
  Scenario: Hub broadcasts state to clients
    Tool: Bash
    Steps:
      1. cd quack2/backend
      2. go test ./internal/hub -v
    Expected Result: PASS
    Evidence: .omo/evidence/task-11-hub.txt
  ```

  **Commit**: YES
  - Message: `feat(backend): implement WebSocket hub`

- [x] 12. Implement mock chat listener

  **What to do**:
  - Implement `MockChat` in `internal/chat/chat.go`
  - Accept seed `int64` for deterministic RNG
  - Emit `!boost <duck-name>` commands on a channel at random intervals
  - Configurable command rate (e.g., 1 command every 2-5 seconds)
  - Provide `Start`/`Stop` methods

  **Must NOT do**:
  - Do not connect to engine yet (done in Task 13)
  - Do not use real IRC

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: Task 13
  - **Blocked By**: Task 7

  **Acceptance Criteria**:
  - [ ] `go test ./internal/chat` passes
  - [ ] Same seed produces identical command sequence

  **QA Scenarios**:
  ```
  Scenario: Deterministic chat commands
    Tool: Bash
    Steps:
      1. cd quack2/backend
      2. go test ./internal/chat -run TestMockChatDeterministic -v
    Expected Result: PASS
    Evidence: .omo/evidence/task-12-chat.txt
  ```

  **Commit**: YES
  - Message: `feat(backend): implement deterministic mock chat listener`

- [x] 13. Wire main.go server

  **What to do**:
  - Create `cmd/main.go`
  - Initialize engine, hub, and mock chat listener
  - Wire HTTP routes: `/health` GET and `/ws` WebSocket upgrade
  - Start game ticker goroutine that broadcasts state every 100ms
  - Forward chat commands to `Engine.Boost`
  - Configure CORS for `http://localhost:3000`
  - Listen on `:8080`

  **Must NOT do**:
  - Do not add Dockerfile yet (Task 22)
  - Do not add frontend code

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Reason**: Integration of all backend components

  **Parallelization**:
  - **Can Run In Parallel**: NO (depends on 8-12)
  - **Parallel Group**: Wave 2
  - **Blocks**: Tasks 22, 24, 25
  - **Blocked By**: Tasks 8, 9, 10, 11, 12

  **Acceptance Criteria**:
  - [ ] `go build ./cmd` succeeds
  - [ ] `go run ./cmd` starts and responds to `/health`
  - [ ] `go test ./...` passes

  **QA Scenarios**:
  ```
  Scenario: Server health and WebSocket
    Tool: Bash
    Steps:
      1. cd quack2/backend
      2. go run ./cmd &
      3. sleep 2
      4. curl -f http://localhost:8080/health
      5. websocat ws://localhost:8080/ws
      6. pkill -f "go run ./cmd"
    Expected Result: Health returns 200; WebSocket receives JSON state array
    Evidence: .omo/evidence/task-13-server.txt
  ```

  **Commit**: YES
  - Message: `feat(backend): wire main.go HTTP and WebSocket server`

- [x] 14. Frontend project setup and dependencies

  **What to do**:
  - Initialize Next.js app in `quack2/frontend` with TypeScript and App Router
  - Install dependencies: `three`, `@react-three/fiber`, `@react-three/drei`
  - Install dev dependencies: `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`
  - Configure `next.config.js` for static export or Docker production
  - Add folder structure under `src/`

  **Must NOT do**:
  - Do not write components yet
  - Do not add Dockerfile yet

  **Recommended Agent Profile**:
  - **Category**: `quick`

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Wave 2 backend tasks)
  - **Parallel Group**: Wave 2
  - **Blocks**: Tasks 15-18
  - **Blocked By**: Task 1

  **Acceptance Criteria**:
  - [ ] `bun install` or `npm install` succeeds
  - [ ] `bun run build` or `npm run build` succeeds (with placeholder pages)
  - [ ] `vitest` config exists

  **QA Scenarios**:
  ```
  Scenario: Frontend builds
    Tool: Bash
    Steps:
      1. cd quack2/frontend
      2. bun install
      3. bun run build
    Expected Result: Build succeeds
    Evidence: .omo/evidence/task-14-frontend-build.txt
  ```

  **Commit**: YES
  - Message: `chore(frontend): initialize Next.js project and Three.js deps`

- [x] 15. WebSocket hook/context

  **What to do**:
  - Create `src/hooks/useRaceSocket.ts`
  - Connect to `ws://localhost:8080/ws` (dev) or `ws://backend:8080/ws` (Docker)
  - Parse incoming `DuckState[]` JSON
  - Expose `connected`, `ducks`, `winner`, `sendCommand(cmd)`
  - Handle reconnect with exponential backoff
  - Handle tab visibility changes gracefully

  **Must NOT do**:
  - Do not render 3D components here
  - Do not put physics in the browser

  **Recommended Agent Profile**:
  - **Category**: `quick`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3
  - **Blocks**: Tasks 19, 20, 21
  - **Blocked By**: Task 14

  **Acceptance Criteria**:
  - [ ] Hook unit test passes with mock WebSocket server
  - [ ] Hook exposes latest duck array and connection status

  **QA Scenarios**:
  ```
  Scenario: Hook receives duck array
    Tool: Bash
    Steps:
      1. cd quack2/frontend
      2. bun test src/hooks/useRaceSocket.test.ts
    Expected Result: PASS
    Evidence: .omo/evidence/task-15-hook.txt
  ```

  **Commit**: YES
  - Message: `feat(frontend): add WebSocket hook for race telemetry`

- [x] 16. Duck renderer component

  **What to do**:
  - Create `src/components/canvas/Duck.tsx`
  - Render `@react-three/fiber` `Sphere` at given X, Y, Z
  - Apply color from duck state
  - Add floating name label using `@react-three/drei` `Text` or `Html`
  - Accept interpolated position props

  **Must NOT do**:
  - Do not implement physics or movement here
  - Do not load external models

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3
  - **Blocks**: Task 19, 21
  - **Blocked By**: Task 14

  **Acceptance Criteria**:
  - [ ] Component renders a sphere with color and name label
  - [ ] Unit test passes

  **QA Scenarios**:
  ```
  Scenario: Duck component snapshot
    Tool: Bash
    Steps:
      1. cd quack2/frontend
      2. bun test src/components/canvas/Duck.test.tsx
    Expected Result: PASS
    Evidence: .omo/evidence/task-16-duck.txt
  ```

  **Commit**: YES
  - Message: `feat(frontend): add Duck renderer with color and name label`

- [x] 17. River component

  **What to do**:
  - Create `src/components/canvas/River.tsx`
  - Render a large plane along the Z axis
  - Use gradient material (blue to teal) to suggest water
  - Optionally animate UV offset for flow effect
  - Position Y below ducks

  **Must NOT do**:
  - Do not load external texture assets
  - Do not implement physics

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3
  - **Blocks**: Task 19
  - **Blocked By**: Task 14

  **Acceptance Criteria**:
  - [ ] River plane visible in overlay
  - [ ] No external assets required

  **QA Scenarios**:
  ```
  Scenario: River renders without errors
    Tool: Bash
    Steps:
      1. cd quack2/frontend
      2. bun test src/components/canvas/River.test.tsx
    Expected Result: PASS
    Evidence: .omo/evidence/task-17-river.txt
  ```

  **Commit**: YES
  - Message: `feat(frontend): add gradient river plane`

- [x] 18. Scene and camera setup

  **What to do**:
  - Create `src/components/canvas/RaceScene.tsx`
  - Set up `Canvas`, lights, and camera
  - Camera frames full river length (Z 0 to 200)
  - Slightly track lead duck on X/Z
  - Add ambient + directional light
  - Set background color

  **Must NOT do**:
  - Do not add orbit controls (OBS source should be static)
  - Do not add post-processing

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3
  - **Blocks**: Task 19
  - **Blocked By**: Task 14

  **Acceptance Criteria**:
  - [ ] Scene renders without errors
  - [ ] Camera position covers Z=0 to Z=200

  **QA Scenarios**:
  ```
  Scenario: Scene camera frames river
    Tool: Bash
    Steps:
      1. cd quack2/frontend
      2. bun test src/components/canvas/RaceScene.test.tsx
    Expected Result: PASS
    Evidence: .omo/evidence/task-18-scene.txt
  ```

  **Commit**: YES
  - Message: `feat(frontend): add race scene and camera`

- [x] 19. Overlay page

  **What to do**:
  - Create `src/app/overlay/page.tsx`
  - Use `RaceScene`, `River`, and `Duck` components
  - Connect to `useRaceSocket`
  - Render ducks at latest server positions
  - Show winner banner when race finished
  - Show "Disconnected" overlay on connection loss

  **Must NOT do**:
  - Do not add controls on this page
  - Do not add interactivity

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`

  **Parallelization**:
  - **Can Run In Parallel**: NO (depends on 15-18)
  - **Parallel Group**: Wave 3
  - **Blocks**: Tasks 23, 25
  - **Blocked By**: Tasks 15, 16, 17, 18

  **Acceptance Criteria**:
  - [ ] Overlay page renders in browser
  - [ ] Ducks appear when server sends state
  - [ ] Winner banner shows on finish

  **QA Scenarios**:
  ```
  Scenario: Overlay shows ducks and winner
    Tool: Playwright
    Steps:
      1. Start backend: cd quack2/backend && go run ./cmd
      2. Open http://localhost:3000/overlay
      3. Spawn ducks via WebSocket control message
      4. Wait for ducks to render
      5. Trigger winner state and assert banner visible
    Expected Result: Ducks render; winner banner appears on finish
    Evidence: .omo/evidence/task-19-overlay.png
  ```

  **Commit**: YES
  - Message: `feat(frontend): add overlay page`

- [x] 20. Control panel page

  **What to do**:
  - Create `src/app/page.tsx`
  - Use `useRaceSocket`
  - Buttons: Spawn Duck, Remove Last Duck, Start Race, Pause Race, Reset Race
  - Display overlay URL: `http://localhost:3000/overlay`
  - Show connection status and current duck count

  **Must NOT do**:
  - Do not implement REST calls (WebSocket only)
  - Do not add styling beyond functional UI

  **Recommended Agent Profile**:
  - **Category**: `quick`

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 15-19)
  - **Parallel Group**: Wave 3
  - **Blocks**: Task 23
  - **Blocked By**: Task 15

  **Acceptance Criteria**:
  - [ ] Buttons send correct WebSocket control messages
  - [ ] Overlay URL is displayed

  **QA Scenarios**:
  ```
  Scenario: Control panel sends commands
    Tool: Playwright
    Steps:
      1. Start backend
      2. Open http://localhost:3000/
      3. Click "Spawn Duck"
      4. Assert duck count increases
      5. Click "Start Race"
      6. Assert race state changes
    Expected Result: Commands reach backend and state updates
    Evidence: .omo/evidence/task-20-control.png
  ```

  **Commit**: YES
  - Message: `feat(frontend): add control panel page`

- [x] 21. Client-side interpolation

  **What to do**:
  - Implement interpolation hook `src/hooks/useInterpolatedDucks.ts`
  - Store previous + current server states with receive timestamps
  - Interpolate position between states based on elapsed time
  - Target 60FPS smooth rendering from 10Hz data
  - Handle missed/skipped frames and tab throttling

  **Must NOT do**:
  - Do not predict future positions
  - Do not run physics

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3
  - **Blocks**: Task 25
  - **Blocked By**: Tasks 15, 16

  **Acceptance Criteria**:
  - [ ] Interpolation tests pass
  - [ ] Visual motion appears smooth in overlay

  **QA Scenarios**:
  ```
  Scenario: Interpolation smoothness
    Tool: Bash
    Steps:
      1. cd quack2/frontend
      2. bun test src/hooks/useInterpolatedDucks.test.ts
    Expected Result: PASS
    Evidence: .omo/evidence/task-21-interpolation.txt
  ```

  **Commit**: YES
  - Message: `feat(frontend): add client-side interpolation`

- [x] 22. Backend Dockerfile

  **What to do**:
  - Create `quack2/backend/Dockerfile`
  - Use multi-stage build with `golang:1.22-alpine`
  - Copy `go.mod`, `go.sum`, source, run `go build -o server ./cmd`
  - Final stage from `alpine` or `scratch`
  - Expose port 8080
  - CMD run compiled binary

  **Must NOT do**:
  - Do not include dev tools or test binaries in final image

  **Recommended Agent Profile**:
  - **Category**: `quick`

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Task 23)
  - **Parallel Group**: Wave 4
  - **Blocks**: Task 24
  - **Blocked By**: Task 13

  **Acceptance Criteria**:
  - [ ] `docker build -t quack2-backend quack2/backend` succeeds
  - [ ] Container responds to `/health`

  **QA Scenarios**:
  ```
  Scenario: Backend Docker image builds and runs
    Tool: Bash
    Steps:
      1. docker build -t quack2-backend quack2/backend
      2. docker run -d -p 8080:8080 --name q2b quack2-backend
      3. sleep 3
      4. curl -f http://localhost:8080/health
      5. docker stop q2b && docker rm q2b
    Expected Result: Health check passes
    Evidence: .omo/evidence/task-22-backend-docker.txt
  ```

  **Commit**: YES
  - Message: `chore(docker): add backend Dockerfile`

- [x] 23. Frontend Dockerfile

  **What to do**:
  - Create `quack2/frontend/Dockerfile`
  - Use `node:20-alpine` or `oven/bun:alpine`
  - Install deps, build Next.js app
  - Serve with `next start` or a static server
  - Expose port 3000
  - Configure WebSocket URL via env var (`NEXT_PUBLIC_WS_URL`)

  **Must NOT do**:
  - Do not hardcode backend URL for production

  **Recommended Agent Profile**:
  - **Category**: `quick`

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Task 22)
  - **Parallel Group**: Wave 4
  - **Blocks**: Task 24
  - **Blocked By**: Tasks 19, 20

  **Acceptance Criteria**:
  - [ ] `docker build -t quack2-frontend quack2/frontend` succeeds
  - [ ] Container serves `/` and `/overlay`

  **QA Scenarios**:
  ```
  Scenario: Frontend Docker image builds and runs
    Tool: Bash
    Steps:
      1. docker build -t quack2-frontend quack2/frontend
      2. docker run -d -p 3000:3000 --name q2f quack2-frontend
      3. sleep 5
      4. curl -f http://localhost:3000/
      5. curl -f http://localhost:3000/overlay
      6. docker stop q2f && docker rm q2f
    Expected Result: Both pages return 200
    Evidence: .omo/evidence/task-23-frontend-docker.txt
  ```

  **Commit**: YES
  - Message: `chore(docker): add frontend Dockerfile`

- [x] 24. docker-compose.yml

  **What to do**:
  - Create `quack2/docker-compose.yml`
  - Define `backend` service on port 8080
  - Define `frontend` service on port 3000
  - Use custom bridge network `quack2-net`
  - Frontend env `NEXT_PUBLIC_WS_URL=ws://backend:8080/ws`
  - Health checks for backend

  **Must NOT do**:
  - Do not use host networking
  - Do not expose unnecessary ports

  **Recommended Agent Profile**:
  - **Category**: `quick`

  **Parallelization**:
  - **Can Run In Parallel**: NO (depends on 22, 23)
  - **Parallel Group**: Wave 4
  - **Blocks**: Task 25
  - **Blocked By**: Tasks 22, 23

  **Acceptance Criteria**:
  - [ ] `docker compose -f quack2/docker-compose.yml config` is valid
  - [ ] `docker compose up --build -d` starts both services

  **QA Scenarios**:
  ```
  Scenario: Compose config valid
    Tool: Bash
    Steps:
      1. cd quack2
      2. docker compose config
    Expected Result: No errors, services backend and frontend defined
    Evidence: .omo/evidence/task-24-compose-config.txt
  ```

  **Commit**: YES
  - Message: `chore(docker): add docker-compose.yml`

- [ ] 25. End-to-end integration smoke test

  **What to do**:
  - Run `docker compose up --build -d` in `quack2/`
  - Verify backend health: `curl http://localhost:8080/health`
  - Verify frontend pages: `curl http://localhost:3000/` and `/overlay`
  - Use Playwright or `websocat` to connect to WebSocket and confirm duck state broadcast
  - Use control panel to spawn ducks and start race
  - Verify ducks render in overlay and move down river
  - Capture screenshots

  **Must NOT do**:
  - Do not stop at unit tests; this is full integration

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`

  **Parallelization**:
  - **Can Run In Parallel**: NO (depends on all implementation)
  - **Parallel Group**: Wave 4
  - **Blocks**: F3
  - **Blocked By**: Tasks 13, 19, 21, 24

  **Acceptance Criteria**:
  - [ ] `docker compose up` succeeds
  - [ ] Backend health passes
  - [ ] Frontend pages return 200
  - [ ] WebSocket sends duck state array
  - [ ] Ducks visible in overlay

  **QA Scenarios**:
  ```
  Scenario: Full Docker Compose integration
    Tool: Bash + Playwright
    Steps:
      1. cd quack2 && docker compose up --build -d
      2. sleep 10
      3. curl -f http://localhost:8080/health
      4. curl -f http://localhost:3000/overlay
      5. Playwright: open /, spawn ducks, start race, open /overlay, wait 5s, screenshot
      6. docker compose down
    Expected Result: All services healthy; ducks visible and moving in screenshot
    Evidence: .omo/evidence/task-25-integration.png
  ```

  **Commit**: YES
  - Message: `test(e2e): add Docker Compose integration smoke test`

---

## Final Verification Wave

> 4 review agents run in PARALLEL. ALL must APPROVE. Present consolidated results to user and get explicit "okay" before completing.

- [ ] F1. **Plan Compliance Audit** — `oracle`
  Read the plan end-to-end. For each "Must Have": verify implementation exists (read file, curl endpoint, run command). For each "Must NOT Have": search codebase for forbidden patterns — reject with file:line if found. Check evidence files exist in `.omo/evidence/`. Compare deliverables against plan.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [ ] F2. **Code Quality Review** — `unspecified-high`
  Run `go vet ./...`, `gofmt -l`, frontend `tsc --noEmit`, linter, `go test ./...`, and `bun test`. Review all changed files for `any` casts, empty catches, `console.log` in prod, commented-out code, unused imports. Check AI slop: excessive comments, over-abstraction, generic names.
  Output: `Build [PASS/FAIL] | Lint [PASS/FAIL] | Tests [N pass/N fail] | Files [N clean/N issues] | VERDICT`

- [ ] F3. **Real Manual QA** — `unspecified-high` (+ `playwright` skill if UI)
  Start from clean state. Execute EVERY QA scenario from EVERY task — follow exact steps, capture evidence. Test cross-task integration. Test edge cases: empty state, invalid input, rapid actions, connection loss. Save to `.omo/evidence/final-qa/`.
  Output: `Scenarios [N/N pass] | Integration [N/N] | Edge Cases [N tested] | VERDICT`

- [ ] F4. **Scope Fidelity Check** — `deep`
  For each task: read "What to do", read actual diff (git log/diff). Verify 1:1 — everything in spec was built (no missing), nothing beyond spec was built (no creep). Check "Must NOT do" compliance. Detect cross-task contamination. Flag unaccounted changes.
  Output: `Tasks [N/N compliant] | Contamination [CLEAN/N issues] | Unaccounted [CLEAN/N files] | VERDICT`

---

## Commit Strategy

- Group commits by wave or by task where tasks are independent.
- Each commit message follows conventional commits: `type(scope): description`
- Example messages:
  - `feat(backend): add duck model and state serialization`
  - `feat(game): implement 10Hz tick loop and linear movement`
  - `feat(frontend): add WebSocket hook for race telemetry`
  - `chore(docker): add docker-compose for frontend and backend`

## Success Criteria

### Verification Commands
```bash
# Backend tests
cd quack2/backend && go test ./...

# Frontend tests
cd quack2/frontend && bun test

# Docker Compose smoke test
cd quack2 && docker compose up --build -d
sleep 10
curl -f http://localhost:8080/health
curl -f http://localhost:3000/
docker compose down
```

### Final Checklist
- [ ] All "Must Have" present
- [ ] All "Must NOT Have" absent
- [ ] All backend tests pass
- [ ] All frontend tests pass
- [ ] Docker Compose builds and runs both services
- [ ] Overlay renders ducks smoothly
- [ ] Control panel controls race state
- [ ] Winner detection works end-to-end
- [ ] Evidence files captured in `.omo/evidence/`
