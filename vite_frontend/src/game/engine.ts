export type GameStatus = 'ready' | 'playing' | 'won' | 'lost'

export type Cell = {
  id: string
  row: number
  col: number
  isMine: boolean
  adjacentMines: number
  isRevealed: boolean
  isFlagged: boolean
}

export type Board = Cell[][]

export type GameState = {
  rows: number
  cols: number
  mineCount: number
  board: Board
  status: GameStatus
  /** Total number of reveals performed (for quick derived checks/debug). */
  revealedCount: number
  /** Mines remaining derived from flags, clamped at 0 for display. */
  minesRemaining: number
  /**
   * Mines are placed lazily on first reveal to guarantee first-click safety.
   * Once placed, this is true.
   */
  hasPlacedMines: boolean
}

/**
 * Deterministic-ish PRNG (mulberry32) so we can seed for reproducible boards if desired.
 * If seed is undefined, we fall back to Math.random.
 */
function makeRng(seed?: number): () => number {
  if (seed === undefined) return Math.random
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function inBounds(rows: number, cols: number, r: number, c: number): boolean {
  return r >= 0 && r < rows && c >= 0 && c < cols
}

function neighbors(rows: number, cols: number, r: number, c: number): Array<[number, number]> {
  const out: Array<[number, number]> = []
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue
      const nr = r + dr
      const nc = c + dc
      if (inBounds(rows, cols, nr, nc)) out.push([nr, nc])
    }
  }
  return out
}

function clampMines(rows: number, cols: number, mines: number): number {
  // Keep at least 1 safe cell.
  const max = Math.max(0, rows * cols - 1)
  return Math.max(0, Math.min(mines, max))
}

function createEmptyBoard(rows: number, cols: number): Board {
  return Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => ({
      id: `${r}:${c}`,
      row: r,
      col: c,
      isMine: false,
      adjacentMines: 0,
      isRevealed: false,
      isFlagged: false
    }))
  )
}

function countAdjacentMines(board: Board, r: number, c: number): number {
  const rows = board.length
  const cols = board[0]?.length ?? 0
  return neighbors(rows, cols, r, c).reduce((acc, [nr, nc]) => acc + (board[nr][nc].isMine ? 1 : 0), 0)
}

function computeAdjacencyCounts(board: Board): Board {
  const rows = board.length
  const cols = board[0]?.length ?? 0
  const next: Board = board.map((row) => row.map((cell) => ({ ...cell })))
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (next[r][c].isMine) {
        next[r][c].adjacentMines = 0
      } else {
        next[r][c].adjacentMines = countAdjacentMines(next, r, c)
      }
    }
  }
  return next
}

function chooseMineLocations(
  rows: number,
  cols: number,
  mineCount: number,
  forbidden: Set<string>,
  rng: () => number
): Set<string> {
  const available: string[] = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const id = `${r}:${c}`
      if (!forbidden.has(id)) available.push(id)
    }
  }

  const mines = new Set<string>()
  const target = Math.min(mineCount, available.length)

  // Fisher-Yates shuffle up to target
  for (let i = 0; i < target; i++) {
    const j = i + Math.floor(rng() * (available.length - i))
    const tmp = available[i]
    available[i] = available[j]
    available[j] = tmp
    mines.add(available[i])
  }

  return mines
}

function placeMinesWithFirstClickSafety(
  board: Board,
  mineCount: number,
  firstRow: number,
  firstCol: number,
  seed?: number
): Board {
  const rows = board.length
  const cols = board[0]?.length ?? 0
  const rng = makeRng(seed)

  // Ensure the first clicked cell is not a mine. Also make its neighbors safe
  // to reduce immediate frustration and allow more frequent flood reveals.
  const forbidden = new Set<string>()
  forbidden.add(`${firstRow}:${firstCol}`)
  for (const [nr, nc] of neighbors(rows, cols, firstRow, firstCol)) {
    forbidden.add(`${nr}:${nc}`)
  }

  const clampedMines = clampMines(rows, cols, mineCount)
  const mineLocs = chooseMineLocations(rows, cols, clampedMines, forbidden, rng)

  const next: Board = board.map((row) => row.map((cell) => ({ ...cell, isMine: mineLocs.has(cell.id) })))
  return computeAdjacencyCounts(next)
}

function recomputeDerived(state: Omit<GameState, 'minesRemaining' | 'revealedCount'>): GameState {
  let revealed = 0
  let flags = 0
  for (const row of state.board) {
    for (const cell of row) {
      if (cell.isRevealed) revealed++
      if (cell.isFlagged) flags++
    }
  }
  const remaining = Math.max(0, state.mineCount - flags)
  return {
    ...state,
    revealedCount: revealed,
    minesRemaining: remaining
  }
}

function checkWin(board: Board, mineCount: number): boolean {
  const total = board.length * (board[0]?.length ?? 0)
  let revealed = 0
  for (const row of board) for (const cell of row) if (cell.isRevealed) revealed++
  return revealed === total - mineCount
}

function revealAllMines(board: Board): Board {
  return board.map((row) =>
    row.map((cell) => (cell.isMine ? { ...cell, isRevealed: true, isFlagged: false } : cell))
  )
}

function revealFlood(board: Board, startR: number, startC: number): Board {
  const rows = board.length
  const cols = board[0]?.length ?? 0
  const next: Board = board.map((row) => row.map((cell) => ({ ...cell })))

  const q: Array<[number, number]> = []
  const seen = new Set<string>()

  const push = (r: number, c: number) => {
    const id = `${r}:${c}`
    if (seen.has(id)) return
    seen.add(id)
    q.push([r, c])
  }

  push(startR, startC)

  while (q.length) {
    const [r, c] = q.shift()!
    const cell = next[r][c]

    // Never auto-reveal flagged cells.
    if (cell.isFlagged) continue
    if (cell.isRevealed) continue

    cell.isRevealed = true

    // Only flood if cell is empty (0 adjacent).
    if (!cell.isMine && cell.adjacentMines === 0) {
      for (const [nr, nc] of neighbors(rows, cols, r, c)) {
        const ncell = next[nr][nc]
        if (!ncell.isRevealed && !ncell.isFlagged && !ncell.isMine) {
          push(nr, nc)
        } else if (!ncell.isRevealed && !ncell.isFlagged && ncell.adjacentMines > 0) {
          // "Border" numbers should reveal when expanding empties (classic behavior).
          push(nr, nc)
        }
      }
    }
  }

  return next
}

// PUBLIC_INTERFACE
export function createNewGame(rows: number, cols: number, mineCount: number): GameState {
  /** Create a new Minesweeper game state (mines are placed on first reveal for safety). */
  const board = createEmptyBoard(rows, cols)
  return recomputeDerived({
    rows,
    cols,
    mineCount: clampMines(rows, cols, mineCount),
    board,
    status: 'ready',
    hasPlacedMines: false
  })
}

// PUBLIC_INTERFACE
export function toggleFlag(state: GameState, row: number, col: number): GameState {
  /** Toggle flag on a cell (no effect if game ended or cell already revealed). */
  if (state.status === 'won' || state.status === 'lost') return state
  const cell = state.board[row]?.[col]
  if (!cell || cell.isRevealed) return state

  const nextBoard: Board = state.board.map((r) => r.map((c) => ({ ...c })))
  nextBoard[row][col].isFlagged = !nextBoard[row][col].isFlagged

  return recomputeDerived({
    ...state,
    board: nextBoard
  })
}

// PUBLIC_INTERFACE
export function revealCell(
  state: GameState,
  row: number,
  col: number,
  options?: { seed?: number }
): GameState {
  /** Reveal a cell, applying first-click safe mine placement and flood fill as needed. */
  if (state.status === 'won' || state.status === 'lost') return state
  const cell = state.board[row]?.[col]
  if (!cell) return state
  if (cell.isRevealed || cell.isFlagged) return state

  let board = state.board

  // Place mines lazily on first reveal so that first click is always safe.
  let hasPlacedMines = state.hasPlacedMines
  let status: GameStatus = state.status === 'ready' ? 'playing' : state.status

  if (!hasPlacedMines) {
    board = placeMinesWithFirstClickSafety(board, state.mineCount, row, col, options?.seed)
    hasPlacedMines = true
  }

  const clicked = board[row][col]
  if (clicked.isMine) {
    const exploded = revealAllMines(
      board.map((r) => r.map((c) => ({ ...c, isFlagged: c.isMine ? false : c.isFlagged })))
    )
    return recomputeDerived({
      ...state,
      board: exploded,
      status: 'lost',
      hasPlacedMines
    })
  }

  const flooded = revealFlood(board, row, col)
  const won = checkWin(flooded, state.mineCount)
  status = won ? 'won' : status

  return recomputeDerived({
    ...state,
    board: flooded,
    status,
    hasPlacedMines
  })
}
