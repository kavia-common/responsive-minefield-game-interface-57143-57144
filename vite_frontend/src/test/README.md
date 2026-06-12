# Frontend tests

This folder contains the Vitest test suite for the Vite + React Minesweeper frontend.

## Run

From `vite_frontend/`:

- `npm test`

## Coverage

- `test_engine.ts`: unit tests for the pure engine (`src/game/engine.ts`)
  - first-click safety (including neighbor safety)
  - flagging rules and derived counters
  - flood fill behavior
  - win/loss detection
- `test_ui.tsx`: integration tests for essential UI behaviors (`src/App.tsx`)
  - renders shell + grid
  - click-to-reveal
  - right-click/context-menu flagging
  - touch long-press flagging
