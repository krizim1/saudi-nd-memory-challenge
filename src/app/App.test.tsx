// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { config } from './config'
import { phaseTransitions } from '../store/phaseMachine'
import { useGameStore } from '../store/gameStore'
import type { GamePhase } from '../game/types'
import { App } from './App'

const allPhases = Object.keys(phaseTransitions) as GamePhase[]

/** Puts the store into a phase directly, bypassing the transition guard. */
function forcePhase(phase: GamePhase) {
  useGameStore.setState({
    phase,
    players: [
      { ...useGameStore.getState().players[0]!, name: 'عبدالله' },
      { ...useGameStore.getState().players[1]!, name: 'محمد' },
    ],
  })
}

describe('App', () => {
  beforeEach(() => {
    useGameStore.getState().resetGame()
    useGameStore.getState().chooseMode()
    useGameStore.getState().setMode('duel')
    useGameStore.getState().registerPlayers('عبدالله', 'محمد')
  })

  afterEach(cleanup)

  it('mounts and shows the attract screen', () => {
    useGameStore.getState().resetGame()
    render(<App />)

    expect(screen.getAllByText(config.branding.gameTitle).length).toBeGreaterThan(0)
  })

  it('renders every phase without throwing', () => {
    for (const phase of allPhases) {
      forcePhase(phase)
      const view = render(<App />)
      expect(view.container.firstChild).not.toBeNull()
      view.unmount()
    }
  })

  it('never reveals a score on the player-complete screen', () => {
    useGameStore.setState((state) => ({
      players: [{ ...state.players[0]!, totalScore: 8420 }, state.players[1]!],
    }))
    forcePhase('player-complete')
    render(<App />)

    expect(screen.queryByText(/8,420/)).toBeNull()
    expect(screen.getByText('عبدالله')).not.toBeNull()
  })

  it('publishes theme tokens onto the document root', () => {
    render(<App />)
    expect(document.documentElement.style.getPropertyValue('--color-accent')).not.toBe('')
  })
})
