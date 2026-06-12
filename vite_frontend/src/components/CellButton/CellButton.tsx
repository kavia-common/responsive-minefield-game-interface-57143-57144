import styles from './CellButton.module.css'

type CellButtonProps = {
  row: number
  col: number
  isRevealed: boolean
  isFlagged: boolean
  isMine: boolean
  adjacentMines: number
  disabled?: boolean
  onReveal: () => void
  onToggleFlag: () => void
  onTouchStart?: (e: React.TouchEvent) => void
  onTouchEnd?: (e: React.TouchEvent) => void
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
  /** A single minefield cell. Supports click (reveal), right-click (flag), and long-press flag on touch devices. */
  const {
    row,
    col,
    isRevealed,
    isFlagged,
    isMine,
    adjacentMines,
    disabled = false,
    onReveal,
    onToggleFlag,
    onTouchStart,
    onTouchEnd
  } = props

  const label = `Row ${row + 1}, Column ${col + 1}`

  const showMine = isRevealed && isMine
  const content = isFlagged ? '⚑' : showMine ? '●' : isRevealed ? adjacentMines || '' : ''

  const ariaLabel = isFlagged
    ? `${label}, flagged`
    : isRevealed
      ? showMine
        ? `${label}, mine`
        : adjacentMines > 0
          ? `${label}, ${adjacentMines} adjacent mines`
          : `${label}, empty`
      : label

  return (
    <button
      type="button"
      disabled={disabled}
      className={[
        styles.cell,
        isRevealed ? styles.revealed : styles.hidden,
        isFlagged ? styles.flagged : '',
        disabled ? styles.disabled : ''
      ].join(' ')}
      onClick={() => {
        if (disabled) return
        onReveal()
      }}
      onContextMenu={(e) => {
        e.preventDefault()
        if (disabled) return
        onToggleFlag()
      }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      aria-label={ariaLabel}
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
