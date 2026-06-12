import styles from './TopPanel.module.css'
import type { DifficultyId } from '../../types/difficulty'
import { DIFFICULTY_PRESETS } from '../../types/difficulty'
import type { GameStatus } from '../../game/engine'

type TopPanelProps = {
  mineCount: number
  minesRemaining: number
  secondsElapsed: number
  difficultyId: DifficultyId
  onChangeDifficulty: (id: DifficultyId) => void
  onReset: () => void
  status: GameStatus
}

// PUBLIC_INTERFACE
export function TopPanel(props: TopPanelProps) {
  /** Top panel for Minesweeper: mine counter, timer, difficulty selector, reset button. */
  const { mineCount, minesRemaining, secondsElapsed, difficultyId, onChangeDifficulty, onReset, status } = props
  const isInProgress = status === 'playing' || status === 'ready'
  const isLocked = status === 'playing'

  return (
    <div className={styles.wrap} aria-label="Game controls">
      <div className={styles.left}>
        <div className={styles.stat} aria-label="Mines remaining">
          <div className={styles.statLabel}>Mines</div>
          <div className={styles.statValue}>
            <span className={styles.mono}>{minesRemaining}</span>
            <span className={styles.statSlash}>/</span>
            <span className={styles.mutedMono}>{mineCount}</span>
          </div>
        </div>

        <div className={styles.stat} aria-label="Timer">
          <div className={styles.statLabel}>Time</div>
          <div className={styles.statValue}>
            <span className={styles.mono}>{secondsElapsed}</span>
            <span className={styles.mutedSuffix}>s</span>
          </div>
        </div>
      </div>

      <div className={styles.right}>
        <label className={styles.selectWrap}>
          <span className={styles.selectLabel}>
            Difficulty{!isInProgress ? ' (finished)' : isLocked ? ' (locked)' : ''}
          </span>
          <select
            className={styles.select}
            value={difficultyId}
            onChange={(e) => onChangeDifficulty(e.target.value as DifficultyId)}
            aria-label="Select difficulty"
            disabled={isLocked}
          >
            {Object.values(DIFFICULTY_PRESETS).map((p) => (
              <option key={p.id} value={p.id}>
                {p.label} ({p.rows}×{p.cols}, {p.mines})
              </option>
            ))}
          </select>
        </label>

        <button type="button" className={styles.resetBtn} onClick={onReset} aria-label="Reset game">
          Reset
        </button>
      </div>
    </div>
  )
}
