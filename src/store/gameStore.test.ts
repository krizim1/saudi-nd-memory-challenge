import { beforeEach, describe, expect, it, vi } from 'vitest'

import { levelCount } from '../game/levels'
import type { LevelResult } from '../game/types'
import { useGameStore } from './gameStore'

const result = (overrides: Partial<LevelResult> = {}): LevelResult => ({
  levelId: 1,
  score: 100,
  timeUsed: 20,
  matches: 4,
  attempts: 6,
  bestStreak: 2,
  breakdown: {
    matchScore: 100,
    streakBonus: 0,
    accuracyBonus: 0,
    speedBonus: 0,
    timeBonus: 0,
    clearBonus: 0,
    subtotal: 100,
    multiplier: 1,
    total: 100,
  },
  ...overrides,
})

/** Registers two players the way the registration screen does. */
function register(nameOne = 'أ', nameTwo = 'ب') {
  useGameStore.getState().chooseMode()
  useGameStore.getState().setMode('duel')
  useGameStore.getState().registerPlayers(nameOne, nameTwo)
}

/** Drives the active player through every configured level. */
function playAllLevels(perLevel: Partial<LevelResult> = {}) {
  for (let i = 0; i < levelCount; i += 1) {
    useGameStore.getState().beginCountdown()
    useGameStore.getState().beginLevel()
    useGameStore.getState().completeLevel(result({ levelId: i + 1, ...perLevel }))
    useGameStore.getState().continueAfterLevel()
  }
}

describe('gameStore flow', () => {
  beforeEach(() => {
    useGameStore.getState().resetGame()
  })

  it('starts on the attract screen with no players', () => {
    expect(useGameStore.getState().phase).toBe('attract')
    expect(useGameStore.getState().players).toEqual([])
  })

  it('registers two players and moves to the intro', () => {
    register(' عبدالله ', 'محمد')

    const { players, phase, activeSlot } = useGameStore.getState()
    expect(phase).toBe('challenge-intro')
    expect(players.map((p) => p.name)).toEqual(['عبدالله', 'محمد'])
    expect(activeSlot).toBe(0)
  })

  it('refuses an illegal transition and warns instead of moving', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    useGameStore.getState().goTo('winner')

    expect(useGameStore.getState().phase).toBe('attract')
    expect(warn).toHaveBeenCalledOnce()
    warn.mockRestore()
  })

  it('accumulates level results into the active player only', () => {
    register()
    useGameStore.getState().beginChallenge()
    useGameStore.getState().beginCountdown()
    useGameStore.getState().beginLevel()
    useGameStore.getState().completeLevel(result({ score: 250, timeUsed: 30, bestStreak: 3 }))

    const [one, two] = useGameStore.getState().players
    expect(one!.totalScore).toBe(250)
    expect(one!.totalTime).toBe(30)
    expect(one!.bestStreak).toBe(3)
    expect(one!.levelResults).toHaveLength(1)
    expect(two!.totalScore).toBe(0)
  })

  it('advances through the levels, then to player-complete on the last one', () => {
    register()
    useGameStore.getState().beginChallenge()

    for (let i = 0; i < levelCount - 1; i += 1) {
      useGameStore.getState().beginCountdown()
      useGameStore.getState().beginLevel()
      useGameStore.getState().completeLevel(result())
      useGameStore.getState().continueAfterLevel()
      expect(useGameStore.getState().currentLevelIndex).toBe(i + 1)
      expect(useGameStore.getState().phase).toBe('countdown')
    }

    useGameStore.getState().beginLevel()
    useGameStore.getState().completeLevel(result())
    useGameStore.getState().continueAfterLevel()
    expect(useGameStore.getState().phase).toBe('player-complete')
  })

  it('hands over to player two with a reset level counter', () => {
    register()
    useGameStore.getState().beginChallenge()
    playAllLevels()
    useGameStore.getState().advanceAfterPlayer()

    expect(useGameStore.getState().phase).toBe('player-switch')
    expect(useGameStore.getState().activeSlot).toBe(1)
    expect(useGameStore.getState().currentLevelIndex).toBe(0)
  })

  it('computes the outcome once the second player finishes', () => {
    register()
    useGameStore.getState().beginChallenge()

    playAllLevels({ score: 300 })
    useGameStore.getState().advanceAfterPlayer()
    useGameStore.getState().beginChallenge()
    playAllLevels({ score: 100 })
    useGameStore.getState().advanceAfterPlayer()

    const { phase, outcome } = useGameStore.getState()
    expect(phase).toBe('results')
    expect(outcome?.winner?.name).toBe('أ')
    expect(outcome?.scoreDifference).toBe(600)
  })

  it('clears players and flow state on reset', () => {
    register()
    useGameStore.getState().beginChallenge()
    useGameStore.getState().beginCountdown()
    useGameStore.getState().resetGame()

    const state = useGameStore.getState()
    expect(state.phase).toBe('attract')
    expect(state.players).toEqual([])
    expect(state.activeSlot).toBe(0)
    expect(state.currentLevelIndex).toBe(0)
    expect(state.outcome).toBeNull()
  })

  it('clamps an out-of-range operator jump into the level sequence', () => {
    useGameStore.getState().jumpToLevel(99)
    expect(useGameStore.getState().currentLevelIndex).toBe(levelCount - 1)
    expect(useGameStore.getState().phase).toBe('countdown')

    useGameStore.getState().resetGame()
    useGameStore.getState().jumpToLevel(-3)
    expect(useGameStore.getState().currentLevelIndex).toBe(0)
  })
})
