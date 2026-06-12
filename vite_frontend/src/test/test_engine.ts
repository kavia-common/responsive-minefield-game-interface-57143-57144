import { describe, expect, it } from 'vitest'
import { createNewGame, revealCell, toggleFlag, type Board, type GameState } from '../game/engine'

function getCell(state: GameState, r: number, c: number) {
  const cell = state.board[r]?.[c]
  if (!cell) throw new Error(`Missing cell at ${r},${c}`)
  return cell
}

function countMines(board: Board): number {
  let mines = 0
  for (const row of board) for (const cell of row) if (cell.isMine) mines++
  return mines
}

function allNeighborCoords(rows: number, cols: number, r: number, c: number): Array<[number, number]> {
  const out: Array<[number, number]> = []
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue
      const nr = r + dr
      const nc = c + dc
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) out.push([nr, nc])
    }
  }
  return out
}

describe('game engine', () => {
  it('createNewGame creates an empty board and is ready', () => {
    const g = createNewGame(3, 4, 2)
    expect(g.status).toBe('ready')
    expect(g.hasPlacedMines).toBe(false)
    expect(g.revealedCount).toBe(0)
    expect(g.minesRemaining).toBe(2)
    expect(g.board).toHaveLength(3)
    expect(g.board[0]).toHaveLength(4)

    // No mines placed until first reveal.
    expect(countMines(g.board)).toBe(0)
  })

  it('first reveal places mines with first-click + neighbor safety (deterministic via seed)', () => {
    const rows = 9
    const cols = 9
    const mines = 10
    const clickR = 4
    const clickC = 4

    const g0 = createNewGame(rows, cols, mines)
    const g1 = revealCell(g0, clickR, clickC, { seed: 123 })

    expect(g1.hasPlacedMines).toBe(true)
    expect(g1.status).toBe('playing')

    // Confirm the clicked cell and its neighbors are not mines.
    expect(getCell(g1, clickR, clickC).isMine).toBe(false)
    for (const [nr, nc] of allNeighborCoords(rows, cols, clickR, clickC)) {
      expect(getCell(g1, nr, nc).isMine).toBe(false)
    }

    // Confirm number of mines equals requested count (within clamp limits).
    expect(countMines(g1.board)).toBe(mines)
  })

  it('toggleFlag toggles on hidden cell and updates minesRemaining; cannot flag revealed cell', () => {
    const g0 = createNewGame(2, 2, 1)
    const g1 = toggleFlag(g0, 0, 0)

    expect(getCell(g1, 0, 0).isFlagged).toBe(true)
    expect(g1.minesRemaining).toBe(0)

    const g2 = toggleFlag(g1, 0, 0)
    expect(getCell(g2, 0, 0).isFlagged).toBe(false)
    expect(g2.minesRemaining).toBe(1)

    // Revealed cell should not be flaggable.
    const g3 = revealCell(g2, 1, 1, { seed: 1 })
    const g4 = toggleFlag(g3, 1, 1)
    expect(getCell(g4, 1, 1).isFlagged).toBe(false)
  })

  it('revealCell does nothing when target is flagged', () => {
    const g0 = createNewGame(3, 3, 1)
    const g1 = toggleFlag(g0, 0, 0)
    const g2 = revealCell(g1, 0, 0, { seed: 5 })

    // Should remain hidden and flagged.
    expect(getCell(g2, 0, 0).isFlagged).toBe(true)
    expect(getCell(g2, 0, 0).isRevealed).toBe(false)
    expect(g2.revealedCount).toBe(0)
  })

  it('revealCell flood-fills empties and reveals border numbers (does not auto-reveal flagged cells)', () => {
    // Choose a board size with 0 mines so everything should flood-reveal.
    const g0 = createNewGame(4, 4, 0)
    const g1 = toggleFlag(g0, 0, 0) // should remain hidden
    const g2 = revealCell(g1, 3, 3, { seed: 999 })

    // All non-flagged cells should become revealed.
    let revealed = 0
    let hidden = 0
    for (const row of g2.board) {
      for (const cell of row) {
        if (cell.isRevealed) revealed++
        else hidden++
      }
    }

    expect(hidden).toBe(1)
    expect(revealed).toBe(15)
    expect(getCell(g2, 0, 0).isFlagged).toBe(true)
    expect(getCell(g2, 0, 0).isRevealed).toBe(false)

    // With mineCount 0 and all safe cells revealed, game should be won.
    expect(g2.status).toBe('won')
  })

  it('revealCell triggers loss if clicking a mine after mines are placed (seeded)', () => {
    const g0 = createNewGame(5, 5, 5)
    const g1 = revealCell(g0, 2, 2, { seed: 42 })

    // Find a mine and click it.
    let mineR = -1
    let mineC = -1
    for (let r = 0; r < g1.rows; r++) {
      for (let c = 0; c < g1.cols; c++) {
        if (getCell(g1, r, c).isMine) {
          mineR = r
          mineC = c
          break
        }
      }
      if (mineR !== -1) break
    }
    expect(mineR).not.toBe(-1)

    const g2 = revealCell(g1, mineR, mineC)
    expect(g2.status).toBe('lost')

    // All mines should be revealed after losing.
    const minesRevealed = g2.board
      .flat()
      .filter((cell) => cell.isMine)
      .every((cell) => cell.isRevealed)
    expect(minesRevealed).toBe(true)
  })

  it('wins when all non-mine cells are revealed (seeded)', () => {
    const g0 = createNewGame(5, 5, 3)
    const g1 = revealCell(g0, 0, 0, { seed: 7 })

    // Reveal all non-mine cells.
    let g = g1
    for (let r = 0; r < g.rows; r++) {
      for (let c = 0; c < g.cols; c++) {
        const cell = getCell(g, r, c)
        if (!cell.isMine && !cell.isRevealed) {
          g = revealCell(g, r, c)
        }
      }
    }

    expect(g.status).toBe('won')
  })
})
