import styles from './MinefieldGrid.module.css'
import { CellButton } from '../CellButton/CellButton'
import type { Board } from '../../game/engine'

type MinefieldGridProps = {
  rows: number
  cols: number
  board: Board
  onRevealCell: (row: number, col: number) => void
  onToggleFlag: (row: number, col: number) => void
}

// PUBLIC_INTERFACE
export function MinefieldGrid(props: MinefieldGridProps) {
  /** Presentational grid for the minefield. Receives engine board + callbacks. */
  const { rows, cols, board, onRevealCell, onToggleFlag } = props

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
            onReveal={() => onRevealCell(r, c)}
            onToggleFlag={() => onToggleFlag(r, c)}
          />
        ))
      )}
    </div>
  )
}
