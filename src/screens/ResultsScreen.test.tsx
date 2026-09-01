// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { App } from '../app/App'
import { compareOutcome, createPlayer } from '../game/players'
import type { Player } from '../game/types'
import { t } from '../i18n'
import { useGameStore } from '../store/gameStore'

function player(name: string, overrides: Partial<Player> = {}): Player {
  return { ...createPlayer(name), ...overrides }
}

/** Seats two finished players and jumps to the given end-of-game phase. */
function showOutcome(one: Player, two: Player, phase: 'results' | 'winner') {
  useGameStore.getState().resetGame()
  useGameStore.setState({
    players: [one, two],
    outcome: compareOutcome(one, two),
    phase,
  })
}

describe('ResultsScreen', () => {
  afterEach(cleanup)

  it('shows both totals and the gap between them', () => {
    showOutcome(
      player('عبدالله', { totalScore: 8420, bestStreak: 6, totalTime: 120, attempts: 30 }),
      player('محمد', { totalScore: 7950, bestStreak: 4, totalTime: 150, attempts: 36 }),
      'results',
    )
    render(<App />)

    expect(screen.getByText('8,420')).not.toBeNull()
    expect(screen.getByText('7,950')).not.toBeNull()
    // Score difference, best streak, fastest time, total attempts.
    expect(screen.getByText('470')).not.toBeNull()
    expect(screen.getByText('6')).not.toBeNull()
    expect(screen.getByText('2:00')).not.toBeNull()
    expect(screen.getByText('66')).not.toBeNull()
  })

  it('marks the head-to-head as a draw when nothing separates the players', () => {
    const shared = { totalScore: 5000, bestStreak: 4, totalTime: 100, attempts: 20 }
    showOutcome(player('عبدالله', shared), player('محمد', shared), 'results')
    render(<App />)

    expect(useGameStore.getState().outcome?.isDraw).toBe(true)
    expect(screen.getByText(t.results.draw)).not.toBeNull()
    expect(screen.queryByText(t.common.vs)).toBeNull()
  })
})

describe('WinnerScreen', () => {
  afterEach(cleanup)

  it('celebrates the winner by name and score', () => {
    showOutcome(
      player('عبدالله', { totalScore: 8420 }),
      player('محمد', { totalScore: 7950 }),
      'winner',
    )
    render(<App />)

    expect(screen.getByText(t.winner.title)).not.toBeNull()
    expect(screen.getByText('عبدالله')).not.toBeNull()
    expect(screen.getByText(`8,420 ${t.common.points}`)).not.toBeNull()
    expect(screen.queryByText('محمد')).toBeNull()
  })

  it('announces a draw instead of a name when there is no winner', () => {
    const shared = { totalScore: 5000, bestStreak: 4, totalTime: 100 }
    showOutcome(player('عبدالله', shared), player('محمد', shared), 'winner')
    render(<App />)

    expect(screen.queryByText(t.winner.title)).toBeNull()
    expect(screen.getAllByText(t.results.draw).length).toBeGreaterThan(0)
    expect(screen.queryByText('عبدالله')).toBeNull()
  })
})
