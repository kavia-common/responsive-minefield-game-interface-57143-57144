import { useMemo, useState } from 'react'
import styles from './App.module.css'
import { TopPanel } from './components/TopPanel/TopPanel'
import { MinefieldGrid } from './components/MinefieldGrid/MinefieldGrid'
import type { DifficultyId, DifficultyPreset } from './types/difficulty'
import { DIFFICULTY_PRESETS } from './types/difficulty'

function makePlaceholderBoard(rows: number, cols: number) {
  // UI scaffold only: we render a clickable-looking grid while the game engine is implemented in step 2.
  return Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => ({
      id: `${r}:${c}`,
      isRevealed: false,
      isFlagged: false,
      isMine: false,
      adjacentMines: 0
    }))
  )
}

// PUBLIC_INTERFACE
export default function App() {
  /** Application shell for Minesweeper UI (top panel + minefield grid). */
  const [difficultyId, setDifficultyId] = useState<DifficultyId>('beginner')

  const preset: DifficultyPreset = useMemo(() => {
    return DIFFICULTY_PRESETS[difficultyId]
  }, [difficultyId])

  const board = useMemo(() => makePlaceholderBoard(preset.rows, preset.cols), [preset.rows, preset.cols])

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <div className={styles.brandTitle}>Minesweeper</div>
          <div className={styles.brandSubtitle}>Modern, minimal, responsive</div>
        </div>
      </header>

      <main className={styles.main}>
        <section className={styles.gameCard} aria-label="Minesweeper game">
          <TopPanel
            mineCount={preset.mines}
            minesRemaining={preset.mines}
            secondsElapsed={0}
            difficultyId={difficultyId}
            onChangeDifficulty={setDifficultyId}
            onReset={() => {
              // In step 2/3, this will create a new game board and reset timer/state.
              // For now, we simply keep UI structure in place.
              setDifficultyId((d) => d)
            }}
          />

          <div className={styles.gridWrap}>
            <MinefieldGrid rows={preset.rows} cols={preset.cols} board={board} />
          </div>
        </section>

        <footer className={styles.footer}>
          <span className={styles.footerHint}>
            Desktop: left click reveal, right click flag. Mobile: flagging UX added in a later step.
          </span>
        </footer>
      </main>
    </div>
  )
}
