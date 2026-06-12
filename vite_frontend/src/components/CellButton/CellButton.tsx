import styles from './CellButton.module.css'

type CellButtonProps = {
  row: number
  col: number
  isRevealed: boolean
  isFlagged: boolean
  isMine: boolean
  adjacentMines: number
  onReveal: () => void
  onToggleFlag: () => void
}

function numberColor(n: number): string {
  // Classic-like number colors, tuned for modern light theme.
  switch (n) {
    case 1:
      return '#2563eb'
    case 2:
      return '#16a34a'
    case 3:
      return '#dc2626'
    case 4:
      return '#7c3aed'
    case 5:
      return '#b45309'
    case 6:
      return '#0f766e'
    case 7:
      return '#111827'
    case 8:
      return '#6b7280'
    default:
      return '#111827'
  }
}

// PUBLIC_INTERFACE
export function CellButton(props: CellButtonProps) {
  /** A single minefield cell. Shows placeholder visuals; game behavior wired in later steps. */
  const { row, col, isRevealed, isFlagged, isMine, adjacentMines, onReveal, onToggleFlag } = props

  const label = `Row ${row + 1}, Column ${col + 1}`
  const content = isFlagged ? '⚑' : isRevealed ? (isMine ? '●' : adjacentMines || '') : ''

  return (
    <button
      type="button"
      className={[
        styles.cell,
        isRevealed ? styles.revealed : styles.hidden,
        isFlagged ? styles.flagged : ''
      ].join(' ')}
      onClick={onReveal}
      onContextMenu={(e) => {
        e.preventDefault()
        onToggleFlag()
      }}
      aria-label={label}
      aria-pressed={isFlagged}
      style={
        isRevealed && !isMine && adjacentMines > 0
          ? ({
              ['--num-color' as any]: numberColor(adjacentMines)
            } as React.CSSProperties)
          : undefined
      }
    >
      <span className={styles.content} aria-hidden="true">
        {content}
      </span>
    </button>
  )
}
