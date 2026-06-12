import { useRef } from 'react'
import styles from './MinefieldGrid.module.css'
import { CellButton } from '../CellButton/CellButton'
import type { Board } from '../../game/engine'

type MinefieldGridProps = {
  rows: number
  cols: number
  board: Board
  disabled?: boolean
  onRevealCell: (row: number, col: number) => void
  onToggleFlag: (row: number, col: number) => void
}

type TouchPoint = {
  row: number
  col: number
  startX: number
  startY: number
  startedAtMs: number
}

// PUBLIC_INTERFACE
export function MinefieldGrid(props: MinefieldGridProps) {
  /** Presentational grid for the minefield. Receives engine board + callbacks, including mobile flagging. */
  const { rows, cols, board, onRevealCell, onToggleFlag, disabled = false } = props

  const touchRef = useRef<TouchPoint | null>(null)
  const longPressTimeoutRef = useRef<number | null>(null)
  const longPressTriggeredRef = useRef<boolean>(false)

  const clearLongPress = () => {
    if (longPressTimeoutRef.current !== null) {
      window.clearTimeout(longPressTimeoutRef.current)
      longPressTimeoutRef.current = null
    }
  }

  const handleTouchStart = (row: number, col: number, e: React.TouchEvent) => {
    if (disabled) return
    if (e.touches.length !== 1) return

    const t = e.touches[0]
    touchRef.current = { row, col, startX: t.clientX, startY: t.clientY, startedAtMs: Date.now() }
    longPressTriggeredRef.current = false

    clearLongPress()
    longPressTimeoutRef.current = window.setTimeout(() => {
      // Long-press flags a cell (mobile-friendly).
      longPressTriggeredRef.current = true
      onToggleFlag(row, col)
    }, 420)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchRef.current) return
    if (e.touches.length !== 1) return

    const t = e.touches[0]
    const dx = Math.abs(t.clientX - touchRef.current.startX)
    const dy = Math.abs(t.clientY - touchRef.current.startY)

    // If user is scrolling/dragging, cancel long-press.
    if (dx > 10 || dy > 10) {
      clearLongPress()
    }
  }

  const handleTouchEnd = () => {
    clearLongPress()
    touchRef.current = null
    // If long-press triggered, we do not reveal on touch end.
    // If it did not trigger, CellButton's click handler will run (tap-to-reveal).
  }

  return (
    <div
      className={[styles.grid, disabled ? styles.disabled : ''].join(' ')}
      role="grid"
      aria-label="Minefield"
      aria-disabled={disabled}
      style={
        {
          ['--cols' as any]: cols,
          ['--rows' as any]: rows
        } as React.CSSProperties
      }
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
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
            disabled={disabled}
            onReveal={() => onRevealCell(r, c)}
            onToggleFlag={() => onToggleFlag(r, c)}
            onTouchStart={(e) => handleTouchStart(r, c, e)}
            onTouchEnd={handleTouchEnd}
          />
        ))
      )}
    </div>
  )
}
