// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { App } from './App'
import { config } from './config'
import { buildDeck } from '../game/cards'
import type { Card } from '../game/types'
import { activeTheme } from '../theme/theme.config'
import { t } from '../i18n'
import { useGameStore } from '../store/gameStore'

/**
 * The whole two-player challenge, driven through the DOM exactly as a
 * pair of players at the touchscreen would drive it.
 *
 * `Math.random` is pinned so each level's deck is reproducible here and
 * the test can tap the pairs it means to tap.
 */

const COUNTDOWN_MS = (config.timing.countdownSteps + 1) * config.timing.countdownStepMs + 100

function advance(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms)
  })
}

function tap(name: string) {
  fireEvent.click(screen.getByRole('button', { name }))
}

/** Picks a mode card, which is a button wrapping its own label. */
function chooseMode(label: string) {
  fireEvent.click(screen.getByText(label).closest('button')!)
}

/** Attract → mode → names → intro, for either mode. */
function startChallenge(mode: 'solo' | 'duel', ...names: string[]) {
  tap(t.common.startChallenge)
  chooseMode(mode === 'solo' ? t.mode.solo : t.mode.duel)

  const inputs = screen.getAllByPlaceholderText(t.registration.namePlaceholder)
  names.forEach((name, index) => {
    fireEvent.change(inputs[index]!, { target: { value: name } })
  })

  tap(t.common.startChallenge)
}

function cardButtons(): HTMLElement[] {
  return screen.getAllByRole('button')
}

function deckFor(levelIndex: number): Card[] {
  return buildDeck(config.levels[levelIndex]!, activeTheme.cards, () => 0)
}

/** Board positions of the two cards sharing the nth dealt face. */
function pairPositions(deck: Card[], pairIndex: number): [number, number] {
  const pairId = [...new Set(deck.map((c) => c.pairId))][pairIndex]!
  const positions = deck.flatMap((card, index) => (card.pairId === pairId ? [index] : []))
  return [positions[0]!, positions[1]!]
}

/** Clears the level by tapping every pair in order. */
function clearLevel(levelIndex: number) {
  const level = config.levels[levelIndex]!
  const deck = deckFor(levelIndex)

  for (let pair = 0; pair < level.pairs; pair += 1) {
    const [a, b] = pairPositions(deck, pair)
    fireEvent.click(cardButtons()[a]!)
    fireEvent.click(cardButtons()[b]!)
    advance(config.timing.inputLockMs)
  }

  advance(config.timing.levelEndDelayMs)
}

/** Lets the clock run out without touching a card. */
function timeOutLevel(levelIndex: number) {
  advance(config.levels[levelIndex]!.timeLimit * 1000)
  // The end-of-level timer is scheduled by the render that reacts to the
  // timeout, so it needs a second advance to fire.
  advance(config.timing.levelEndDelayMs)
}

/** Waits out a countdown and lands on the board. */
function enterLevel() {
  advance(COUNTDOWN_MS)
}

/**
 * Plays one player's whole turn, from their ready screen to the screen
 * confirming their result.
 *
 * Only the first level is preceded by a ready screen — after that the
 * store goes straight from level-complete into the next countdown.
 */
function playTurn(playLevel: (levelIndex: number) => void) {
  tap(t.common.start)
  enterLevel()

  for (let levelIndex = 0; levelIndex < config.levels.length; levelIndex += 1) {
    playLevel(levelIndex)

    advance(config.timing.levelCompleteAutoAdvanceMs)

    if (levelIndex < config.levels.length - 1) {
      enterLevel()
    }
  }
}

describe('the full two-player challenge', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.spyOn(Math, 'random').mockReturnValue(0)
    useGameStore.getState().resetGame()
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('runs attract → registration → three levels each → winner', () => {
    render(<App />)

    startChallenge('duel', 'عبدالله', 'محمد')

    // Challenge intro.
    expect(screen.getByText(t.intro.rulesHeading)).not.toBeNull()
    tap(t.common.startChallenge)

    // Player one plays all three levels cleanly.
    expect(screen.getByText('عبدالله')).not.toBeNull()
    playTurn(clearLevel)

    // Player one is done, and their score is not on screen.
    expect(screen.getByText(t.playerComplete.recorded)).not.toBeNull()
    const playerOneScore = useGameStore.getState().players[0]!.totalScore
    expect(playerOneScore).toBeGreaterThan(0)
    expect(screen.queryByText(new RegExp(String(playerOneScore)))).toBeNull()

    tap(t.common.continue)

    // Handover.
    expect(screen.getByText(t.playerSwitch.turnOf('محمد'))).not.toBeNull()
    tap(t.common.ready)

    // Player two lets every level time out.
    playTurn(timeOutLevel)
    tap(t.common.continue)

    // Results.
    expect(screen.getByText(t.results.title)).not.toBeNull()
    const state = useGameStore.getState()
    expect(state.phase).toBe('results')
    expect(state.outcome?.winner?.name).toBe('عبدالله')
    expect(state.outcome?.isDraw).toBe(false)
    expect(state.players[1]!.totalScore).toBe(0)
    expect(state.outcome?.scoreDifference).toBe(playerOneScore)

    // Winner.
    tap(t.common.continue)
    expect(screen.getByText(t.winner.title)).not.toBeNull()
    expect(screen.getByText('عبدالله')).not.toBeNull()
  })

  it('records three level results per player, each level exactly once', () => {
    render(<App />)
    startChallenge('duel', 'سارة', 'خالد')
    tap(t.common.startChallenge)

    playTurn(clearLevel)

    const player = useGameStore.getState().players[0]!
    expect(player.levelResults.map((r) => r.levelId)).toEqual(config.levels.map((l) => l.id))
    expect(player.totalScore).toBe(
      player.levelResults.reduce((sum, r) => sum + r.score, 0),
    )
    expect(player.matches).toBe(config.levels.reduce((sum, l) => sum + l.pairs, 0))
  })

  it('rewards the faster player when both clear every level', () => {
    render(<App />)
    startChallenge('duel', 'سريع', 'بطيء')
    tap(t.common.startChallenge)

    // Player one plays straight through.
    playTurn(clearLevel)
    tap(t.common.continue)
    tap(t.common.ready)

    // Player two clears the same boards, but dawdles on every one.
    playTurn((levelIndex) => {
      advance(10_000)
      clearLevel(levelIndex)
    })
    tap(t.common.continue)

    const { players, outcome } = useGameStore.getState()
    expect(players[0]!.matches).toBe(players[1]!.matches)
    expect(outcome?.winner?.name).toBe('سريع')
    expect(outcome?.scoreDifference).toBeGreaterThan(0)
  })
})

describe('the solo challenge', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.spyOn(Math, 'random').mockReturnValue(0)
    useGameStore.getState().resetGame()
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('asks for one name, not two', () => {
    render(<App />)
    tap(t.common.startChallenge)
    chooseMode(t.mode.solo)

    expect(screen.getAllByPlaceholderText(t.registration.namePlaceholder)).toHaveLength(1)
    expect(screen.queryByText(t.registration.playerTwo)).toBeNull()
  })

  it('runs one player through three levels to their own result', () => {
    render(<App />)
    startChallenge('solo', 'عبدالله')
    tap(t.common.startChallenge)

    playTurn(clearLevel)

    expect(screen.getByText(t.playerComplete.soloDone)).not.toBeNull()
    tap(t.common.continue)

    const state = useGameStore.getState()
    expect(state.phase).toBe('results')
    expect(state.players).toHaveLength(1)
    expect(state.players[0]!.levelResults).toHaveLength(config.levels.length)
    expect(state.players[0]!.totalScore).toBeGreaterThan(0)
  })

  it('shows the player their own score, with no opponent and no draw', () => {
    render(<App />)
    startChallenge('solo', 'عبدالله')
    tap(t.common.startChallenge)
    playTurn(clearLevel)
    tap(t.common.continue)

    expect(screen.getByText(t.results.yourScore)).not.toBeNull()
    expect(screen.getByText('عبدالله')).not.toBeNull()
    expect(screen.queryByText(t.common.vs)).toBeNull()
    expect(screen.queryByText(t.results.draw)).toBeNull()
    expect(useGameStore.getState().outcome).toBeNull()
  })

  it('goes from the result to the standings, skipping the winner screen', () => {
    render(<App />)
    startChallenge('solo', 'عبدالله')
    tap(t.common.startChallenge)
    playTurn(clearLevel)
    tap(t.common.continue)

    tap(t.leaderboard.title)

    expect(useGameStore.getState().phase).toBe('leaderboard')
  })

  it('never asks a solo player to hand over to anyone', () => {
    render(<App />)
    startChallenge('solo', 'عبدالله')
    tap(t.common.startChallenge)
    playTurn(clearLevel)

    expect(screen.queryByText(t.playerSwitch.nextPlayer)).toBeNull()
    tap(t.common.continue)
    expect(useGameStore.getState().phase).not.toBe('player-switch')
  })
})
