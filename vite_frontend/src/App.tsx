import { useEffect, useMemo, useRef, useState } from 'react'
import styles from './App.module.css'
import { TopPanel } from './components/TopPanel/TopPanel'
import { MinefieldGrid } from './components/MinefieldGrid/MinefieldGrid'
import type { DifficultyId, DifficultyPreset } from './types/difficulty'
import { DIFFICULTY_PRESETS } from './types/difficulty'
import { createNewGame, revealCell, toggleFlag, type GameState } from './game/engine'

function newGameFromPreset(preset: DifficultyPreset): GameState {
  return createNewGame(preset.rows, preset.cols, preset.mines)
}

type GameOutcome = 'won' | 'lost' | null

function formatSeconds(totalSeconds: number): string {
  // Keep a compact display; classic minesweeper is usually seconds-only.
  return String(Math.max(0, Math.floor(totalSeconds)))
}

// PUBLIC_INTERFACE
export default function App() {
  /** Application shell for Minesweeper UI (top panel + minefield grid + end overlays + timer). */
  const [difficultyId, setDifficultyId] = useState<DifficultyId>('beginner')
  const preset: DifficultyPreset = useMemo(() => DIFFICULTY_PRESETS[difficultyId], [difficultyId])

  const [game, setGame] = useState<GameState>(() => newGameFromPreset(preset))

  // Timer: starts on first meaningful action (first reveal or first flag), stops on win/loss/reset.
  const [secondsElapsed, setSecondsElapsed] = useState<number>(0)
  const timerRef = useRef<number | null>(null)

  const startTimerIfNeeded = () => {
    if (timerRef.current !== null) return
    timerRef.current = window.setInterval(() => {
      setSecondsElapsed((s) => s + 1)
    }, 1000)
  }

  const stopTimer = () => {
    if (timerRef.current === null) return
    window.clearInterval(timerRef.current)
    timerRef.current = null
  }

  const resetTimer = () => {
    stopTimer()
    setSecondsElapsed(0)
  }

  useEffect(() => {
    // Ensure timer is cleaned up on unmount.
    return () => stopTimer()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Stop timer when game ends.
  useEffect(() => {
    if (game.status === 'won' || game.status === 'lost') stopTimer()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.status])

  const outcome: GameOutcome = game.status === 'won' ? 'won' : game.status === 'lost' ? 'lost' : null

  const applyDifficulty = (id: DifficultyId) => {
    setDifficultyId(id)
    const nextPreset = DIFFICULTY_PRESETS[id]
    setGame(newGameFromPreset(nextPreset))
    resetTimer()
  }

  const reset = () => {
    setGame(newGameFromPreset(preset))
    resetTimer()
  }

  const onRevealCell = (r: number, c: number) => {
    if (game.status === 'won' || game.status === 'lost') return
    // Start timer on first reveal.
    startTimerIfNeeded()
    setGame((g) => revealCell(g, r, c))
  }

  const onToggleFlag = (r: number, c: number) => {
    if (game.status === 'won' || game.status === 'lost') return
    // Start timer on first flag as well (mobile users may flag before first reveal).
    startTimerIfNeeded()
    setGame((g) => toggleFlag(g, r, c))
  }

  const footerText =
    outcome === 'won'
      ? 'You won! Reset to play again.'
      : outcome === 'lost'
        ? 'Boom! You hit a mine. Reset to try again.'
        : 'Desktop: left click reveal, right click flag. Mobile: tap to reveal, long-press to flag.'

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
            secondsElapsed={secondsElapsed}
            difficultyId={difficultyId}
            onChangeDifficulty={applyDifficulty}
            onReset={reset}
            status={game.status}
          />

          <div className={styles.gridWrap}>
            <MinefieldGrid
              rows={preset.rows}
              cols={preset.cols}
              board={game.board}
              disabled={game.status === 'won' || game.status === 'lost'}
              onRevealCell={onRevealCell}
              onToggleFlag={onToggleFlag}
            />

            {outcome !== null && (
              <div
                className={[
                  styles.overlay,
                  outcome === 'won' ? styles.overlayWin : styles.overlayLose
                ].join(' ')}
                role="status"
                aria-live="polite"
                aria-label={outcome === 'won' ? 'You won' : 'You lost'}
              >
                <div className={styles.overlayCard}>
                  <div className={styles.overlayTitle}>{outcome === 'won' ? 'You win' : 'Game over'}</div>
                  <div className={styles.overlaySubtitle}>
                    {outcome === 'won'
                      ? `Cleared in ${formatSeconds(secondsElapsed)}s.`
                      : `Time: ${formatSeconds(secondsElapsed)}s.`}
                  </div>
                  <div className={styles.overlayActions}>
                    <button type="button" className={styles.primaryBtn} onClick={reset}>
                      New game
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        <footer className={styles.footer}>
          <span className={styles.footerHint}>{footerText}</span>
        </footer>
      </main>
    </div>
  )
}
