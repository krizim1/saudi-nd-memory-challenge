// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { App } from '../app/App'
import { config } from '../app/config'
import { buildDeck } from '../game/cards'
import type { Card } from '../game/types'
import { activeTheme } from '../theme/theme.config'
import { useGameStore } from '../store/gameStore'

const level = config.levels[0]!

/**
 * With `Math.random` pinned, the component's deck is reproducible here,
 * so the test can tap the pair it means to tap instead of guessing.
 */
function expectedDeck(): Card[] {
  return buildDeck(level, activeTheme.cards, () => 0)
}

function cardButtons(): HTMLElement[] {
  return screen.getAllByRole('button')
}

/** Board positions of the two cards sharing the nth dealt face. */
function pairPositions(deck: Card[], pairIndex: number): [number, number] {
  const pairId = [...new Set(deck.map((c) => c.pairId))][pairIndex]!
  const positions = deck.flatMap((card, index) => (card.pairId === pairId ? [index] : []))
  return [positions[0]!, positions[1]!]
}

function mismatchPositions(deck: Card[]): [number, number] {
  const other = deck.findIndex((card) => card.pairId !== deck[0]!.pairId)
  return [0, other]
}

function advance(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms)
  })
}

/**
 * Advances the clock in small steps, so React re-renders and effects
 * re-run between ticks the way they do in a browser. A single large
 * advance fires every timer inside one `act`, which can hide an effect
 * that is being cancelled and re-armed on each render.
 */
function advanceRealistically(ms: number, stepMs = 50) {
  for (let elapsed = 0; elapsed < ms; elapsed += stepMs) {
    advance(stepMs)
  }
}

function faceUpCount(): number {
  return cardButtons().filter((button) => button.getAttribute('aria-label') !== null).length
}

describe('GameScreen', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.spyOn(Math, 'random').mockReturnValue(0)

    useGameStore.getState().resetGame()
    useGameStore.getState().chooseMode()
    useGameStore.getState().setMode('duel')
    useGameStore.getState().registerPlayers('عبدالله', 'محمد')
    useGameStore.setState({ phase: 'playing' })
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('deals a full board of face-down cards', () => {
    render(<App />)

    expect(cardButtons()).toHaveLength(level.rows * level.columns)
    expect(faceUpCount()).toBe(0)
  })

  it('counts a matched pair and leaves both cards face-up', () => {
    render(<App />)
    const [a, b] = pairPositions(expectedDeck(), 0)

    fireEvent.click(cardButtons()[a]!)
    fireEvent.click(cardButtons()[b]!)
    advance(config.timing.inputLockMs)

    expect(screen.getByText(`1 / ${level.pairs}`)).not.toBeNull()
    expect(faceUpCount()).toBe(2)
  })

  it('turns a mismatched pair back over after the reveal delay', () => {
    render(<App />)
    const [a, b] = mismatchPositions(expectedDeck())

    fireEvent.click(cardButtons()[a]!)
    fireEvent.click(cardButtons()[b]!)
    expect(faceUpCount()).toBe(2)

    advance(config.timing.mismatchRevealMs)

    expect(faceUpCount()).toBe(0)
    expect(screen.getByText(`0 / ${level.pairs}`)).not.toBeNull()
  })

  it('turns a mismatched pair back over while the game clock is running', () => {
    render(<App />)
    const [a, b] = mismatchPositions(expectedDeck())

    fireEvent.click(cardButtons()[a]!)
    fireEvent.click(cardButtons()[b]!)
    expect(faceUpCount()).toBe(2)

    advanceRealistically(config.timing.mismatchRevealMs + 200)

    expect(faceUpCount()).toBe(0)
  })

  it('stays playable after a mismatch, with the clock running throughout', () => {
    render(<App />)
    const deck = expectedDeck()
    const [a, b] = mismatchPositions(deck)

    fireEvent.click(cardButtons()[a]!)
    fireEvent.click(cardButtons()[b]!)
    advanceRealistically(config.timing.mismatchRevealMs + 200)

    const [c, d] = pairPositions(deck, 0)
    fireEvent.click(cardButtons()[c]!)
    fireEvent.click(cardButtons()[d]!)
    advanceRealistically(config.timing.inputLockMs + 200)

    expect(screen.getByText(`1 / ${level.pairs}`)).not.toBeNull()
  })

  it('ignores a third tap while a pair is being judged', () => {
    render(<App />)
    const [a, b] = mismatchPositions(expectedDeck())
    const third = [0, 1, 2, 3].find((i) => i !== a && i !== b)!

    fireEvent.click(cardButtons()[a]!)
    fireEvent.click(cardButtons()[b]!)
    fireEvent.click(cardButtons()[third]!)

    expect(faceUpCount()).toBe(2)
  })

  it('ignores repeated taps on the same card', () => {
    render(<App />)

    fireEvent.click(cardButtons()[0]!)
    fireEvent.click(cardButtons()[0]!)
    fireEvent.click(cardButtons()[0]!)

    expect(faceUpCount()).toBe(1)
  })

  it('runs the clock down and announces a timeout', () => {
    render(<App />)

    expect(screen.getByText(String(level.timeLimit))).not.toBeNull()
    advance(level.timeLimit * 1000)

    expect(screen.getByText('انتهى الوقت')).not.toBeNull()
  })

  it('records the level and moves on when the clock runs out', () => {
    render(<App />)

    // Two steps on purpose: the end-of-level timer is only scheduled by
    // the render that reacts to the timeout, so it cannot be flushed by
    // the same batch of timers that caused it.
    advance(level.timeLimit * 1000)
    advance(config.timing.levelEndDelayMs)

    const state = useGameStore.getState()
    expect(state.phase).toBe('level-complete')
    expect(state.players[0]!.levelResults).toHaveLength(1)
    expect(state.players[0]!.levelResults[0]!.timeUsed).toBe(level.timeLimit)
  })

  it('clears the level when every pair is found, and banks the statistics', () => {
    render(<App />)
    const deck = expectedDeck()

    for (let pair = 0; pair < level.pairs; pair += 1) {
      const [a, b] = pairPositions(deck, pair)
      fireEvent.click(cardButtons()[a]!)
      fireEvent.click(cardButtons()[b]!)
      advance(config.timing.inputLockMs)
    }

    expect(screen.getByText(`${level.pairs} / ${level.pairs}`)).not.toBeNull()

    advance(config.timing.levelEndDelayMs)

    const state = useGameStore.getState()
    expect(state.phase).toBe('level-complete')

    const result = state.players[0]!.levelResults[0]!
    expect(result.matches).toBe(level.pairs)
    expect(result.attempts).toBe(level.pairs)
    expect(result.bestStreak).toBe(level.pairs)
    expect(result.timeUsed).toBeLessThan(level.timeLimit)
  })
})
