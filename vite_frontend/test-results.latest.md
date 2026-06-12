# Vite Frontend Test Results (latest)

Container: `vite_frontend`  
Command: `npm test` (Vitest `run --reporter=verbose`)  
Status: **FAIL** (1 failing test)

## Totals
- Total tests: 11
- Passed: 10
- Failed: 1
- Skipped: 0

## Failing test
- File: `src/test/test_ui.tsx`
- Test: `Minesweeper UI (App integration) > long-press (touch) flags a cell (MinefieldGrid mobile behavior)`
- Error:
  - `TestingLibraryElementError: Unable to find an accessible element with the role "button" and name "Row 2, Column 1, flagged"`

## Notes / suspected root cause
`MinefieldGrid` attaches `onTouchStart` handlers to each `CellButton` (per-cell), not to the grid container.
The current test fires `touchStart` on the grid container, so the per-cell long-press logic does not run, and no cell is flagged.

## Recommendation
Update the long-press test to dispatch `touchStart`/`touchEnd` to the target cell button (e.g. the button with aria-label `Row 2, Column 1`), then advance fake timers past the 420ms threshold and assert the aria-label updates to include `, flagged`.
