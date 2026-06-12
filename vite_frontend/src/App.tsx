import { useMemo, useState } from 'react'
import styles from './App.module.css'
import { TopPanel } from './components/TopPanel/TopPanel'
import { MinefieldGrid } from './components/MinefieldGrid/MinefieldGrid'
import type { DifficultyId, DifficultyPreset } from './types/difficulty'
import { DIFFICULTY_PRESETS } from './types/difficulty'
import { createNewGame, revealCell, toggleFlag, type GameState } from './game/engine'

function newGameFromPreset(preset: DifficultyPreset): GameState {
  return createNewGame(preset.rows, preset.cols, preset.mines)
}

// PUBLIC_INTERFACE
export default function App() {
  /** Application shell for Minesweeper UI (top panel + minefield grid). */
  const [difficultyId, setDifficultyId] = useState<DifficultyId>('beginner')

  const preset: DifficultyPreset = useMemo(() => DIFFICULTY_PRESETS[difficultyId], [difficultyId])

  const [game, setGame] = useState<GameState>(() => newGameFromPreset(preset))

  // When difficulty changes, immediately create a new board for that preset.
  // (Timer/state wiring is a later step; engine is complete in this step.)
  const applyDifficulty = (id: DifficultyId) => {
    setDifficultyId(id)
    const nextPreset = DIFFICULTY_PRESETS[id]
    setGame(newGameFromPreset(nextPreset))
  }

  const reset = () => {
    setGame(newGameFromPreset(preset))
  }

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
            minesRemaining={game.minesRemaining}
            secondsElapsed={0}
            difficultyId={difficultyId}
            onChangeDifficulty={applyDifficulty}
            onReset={reset}
          />

          <div className={styles.gridWrap}>
            <MinefieldGrid
              rows={preset.rows}
              cols={preset.cols}
              board={game.board}
              onRevealCell={(r, c) => setGame((g) => revealCell(g, r, c))}
              onToggleFlag={(r, c) => setGame((g) => toggleFlag(g, r, c))}
            />
          </div>
        </section>

        <footer className={styles.footer}>
          <span className={styles.footerHint}>
            Desktop: left click reveal, right click flag. Mobile: flagging UX added in a later step.
            {game.status === 'won' ? ' You won!' : game.status === 'lost' ? ' Boom! You lost.' : ''}
          </span>
        </footer>
      </main>
    </div>
  )
}
