import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import App from '../App'

describe('Minesweeper UI (App integration)', () => {
  it('renders the game shell and minefield grid', () => {
    render(<App />)
    expect(screen.getByText('Minesweeper')).toBeInTheDocument()
    expect(screen.getByLabelText('Game controls')).toBeInTheDocument()
    expect(screen.getByRole('grid', { name: 'Minefield' })).toBeInTheDocument()
  })

  it('clicking a cell reveals it (aria-label changes from "Row x, Column y")', () => {
    render(<App />)

    const cell = screen.getByRole('button', { name: 'Row 1, Column 1' })
    fireEvent.click(cell)

    // After reveal, aria-label will become "... empty" or "... N adjacent mines" (engine-dependent).
    const revealed =
      screen.queryByRole('button', { name: /Row 1, Column 1, (empty|\d+ adjacent mines)/ }) ??
      screen.queryByRole('button', { name: /Row 1, Column 1, mine/ })
    expect(revealed).not.toBeNull()
  })

  it('right-click flags a cell (context menu), updating aria-label and aria-pressed', () => {
    render(<App />)

    const cell = screen.getByRole('button', { name: 'Row 1, Column 2' })
    // Use contextMenu event to simulate right-click.
    fireEvent.contextMenu(cell)

    const flagged = screen.getByRole('button', { name: 'Row 1, Column 2, flagged' })
    expect(flagged).toHaveAttribute('aria-pressed', 'true')
  })

  it('long-press (touch) flags a cell (MinefieldGrid mobile behavior)', () => {
    vi.useFakeTimers()
    render(<App />)

    // MinefieldGrid attaches touch handlers to the grid container (role="grid"),
    // not to the individual cell buttons. So we must dispatch touch events to the grid,
    // while using the cell label only to confirm state changes.
    const grid = screen.getByRole('grid', { name: 'Minefield' })

    // Create a touch event with a single touch point.
    const touch = { clientX: 10, clientY: 10 }
    fireEvent.touchStart(grid, { touches: [touch] })

    // Long press threshold is 420ms in MinefieldGrid.
    act(() => {
      vi.advanceTimersByTime(450)
    })

    const flagged = screen.getByRole('button', { name: 'Row 2, Column 1, flagged' })
    expect(flagged).toBeInTheDocument()

    vi.useRealTimers()
  })
})
