import styles from './MinefieldGrid.module.css'
import { CellButton } from '../CellButton/CellButton'

type PlaceholderCell = {
  id: string
  isRevealed: boolean
  isFlagged: boolean
  isMine: boolean
  adjacentMines: number
}

type MinefieldGridProps = {
  rows: number
  cols: number
  board: PlaceholderCell[][]
}

// PUBLIC_INTERFACE
export function MinefieldGrid(props: MinefieldGridProps) {
  /** Presentational grid for the minefield. Game behavior is wired in later steps. */
  const { rows, cols, board } = props

  return (
    <div
      className={styles.grid}
      role="grid"
      aria-label="Minefield"
      style={
        {
          ['--cols' as any]: cols,
          ['--rows' as any]: rows
        } as React.CSSProperties
      }
    >
      {board.flatMap((row, r) =>
        row.map((cell, c) => (
          <CellButton
            key={cell.id}
            row={r}
            col={c}
            isRevealed={cell.isRevealed}
            isFlagged={cell.isFlagged}
            isMine={cell.isMine}
            adjacentMines={cell.adjacentMines}
            onReveal={() => {
              // no-op placeholder (engine later)
            }}
            onToggleFlag={() => {
              // no-op placeholder (engine later)
            }}
          />
        ))
      )}
    </div>
  )
}
