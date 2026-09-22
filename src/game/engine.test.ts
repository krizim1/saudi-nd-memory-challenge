import { describe, expect, it } from 'vitest'

import { config } from '../app/config'
import {
  canFlip,
  createEngineState,
  currentScore,
  flipCard,
  isFinished,
  resolvePending,
  scoreBreakdown,
  tick,
  timeUsed,
  toLevelResult,
  type EngineState,
} from './engine'
import type { CardFace, LevelConfig } from './types'

const level: LevelConfig = { id: 1, rows: 2, columns: 2, pairs: 2, timeLimit: 30 }

const faces: CardFace[] = [
  { id: 'palm', alt: 'نخلة' },
  { id: 'falcon', alt: 'صقر' },
  { id: 'dates', alt: 'تمر' },
  { id: 'swords', alt: 'سيفان' },
  { id: 'diriyah', alt: 'الدرعية' },
  { id: 'coffee', alt: 'دلة قهوة' },
]

/** Deterministic board so every test knows exactly which card is where. */
function newGame(config: LevelConfig = level): EngineState {
  return createEngineState(config, faces, () => 0.5)
}

/**
 * The distinct faces actually dealt, in board order. A level draws only
 * as many faces as it has pairs, so tests address them by position
 * rather than by name.
 */
function dealtFaces(state: EngineState): string[] {
  return [...new Set(state.cards.map((c) => c.pairId))]
}

/** The two instance ids sharing the nth dealt face. */
function pairIds(state: EngineState, faceIndex: number): [string, string] {
  const pairId = dealtFaces(state)[faceIndex]!
  const ids = state.cards.filter((c) => c.pairId === pairId).map((c) => c.instanceId)
  return [ids[0]!, ids[1]!]
}

/** Two still-hidden instance ids showing different faces. */
function mismatchIds(state: EngineState): [string, string] {
  const hidden = state.cards.filter((c) => c.state === 'hidden')
  const first = hidden[0]!
  const other = hidden.find((c) => c.pairId !== first.pairId)!
  return [first.instanceId, other.instanceId]
}

/** Plays the nth pair through to the end of its reveal delay. */
function playPair(state: EngineState, faceIndex: number): EngineState {
  const [a, b] = pairIds(state, faceIndex)
  return resolvePending(flipCard(flipCard(state, a), b))
}

describe('createEngineState', () => {
  it('starts unlocked, running, and on the full clock', () => {
    const state = newGame()

    expect(state.status).toBe('running')
    expect(state.locked).toBe(false)
    expect(state.pending).toBeNull()
    expect(state.timeRemaining).toBe(level.timeLimit)
    expect(state.matches).toBe(0)
    expect(state.attempts).toBe(0)
    expect(state.cards).toHaveLength(level.pairs * 2)
  })
})

describe('flipping a single card', () => {
  it('reveals it and records nothing else', () => {
    const state = newGame()
    const id = state.cards[0]!.instanceId
    const next = flipCard(state, id)

    expect(next.revealed).toEqual([id])
    expect(next.cards.find((c) => c.instanceId === id)!.state).toBe('revealed')
    expect(next.attempts).toBe(0)
    expect(next.locked).toBe(false)
  })

  it('ignores a second tap on the same card', () => {
    const state = newGame()
    const id = state.cards[0]!.instanceId
    const once = flipCard(state, id)

    expect(flipCard(once, id)).toBe(once)
    expect(once.revealed).toEqual([id])
  })

  it('ignores an unknown card id', () => {
    const state = newGame()
    expect(flipCard(state, 'not-a-card')).toBe(state)
  })
})

describe('matching a pair', () => {
  it('scores the match, keeps both cards visible, and locks input', () => {
    const state = newGame()
    const [a, b] = pairIds(state, 0)
    const next = flipCard(flipCard(state, a), b)

    expect(next.matches).toBe(1)
    expect(next.attempts).toBe(1)
    expect(next.streak).toBe(1)
    expect(next.bestStreak).toBe(1)
    expect(next.locked).toBe(true)
    expect(next.pending).toBe('match')
    expect(next.cards.filter((c) => c.state === 'matched')).toHaveLength(2)
  })

  it('leaves matched cards face-up after resolution and unlocks', () => {
    const state = newGame()
    const [a, b] = pairIds(state, 0)
    const resolved = resolvePending(flipCard(flipCard(state, a), b))

    expect(resolved.cards.filter((c) => c.state === 'matched')).toHaveLength(2)
    expect(resolved.locked).toBe(false)
    expect(resolved.revealed).toEqual([])
    expect(resolved.pending).toBeNull()
  })

  it('never re-opens a matched card', () => {
    const state = playPair(newGame(), 0)
    const [a] = pairIds(state, 0)

    expect(canFlip(state, a)).toBe(false)
    expect(flipCard(state, a)).toBe(state)
  })
})

describe('missing a pair', () => {
  it('counts the attempt, resets the streak, and locks input', () => {
    const state = newGame()
    const [a, b] = mismatchIds(state)
    const next = flipCard(flipCard(state, a), b)

    expect(next.matches).toBe(0)
    expect(next.attempts).toBe(1)
    expect(next.streak).toBe(0)
    expect(next.locked).toBe(true)
    expect(next.pending).toBe('mismatch')
  })

  it('flips both cards back on resolution', () => {
    const state = newGame()
    const [a, b] = mismatchIds(state)
    const resolved = resolvePending(flipCard(flipCard(state, a), b))

    expect(resolved.cards.every((c) => c.state === 'hidden')).toBe(true)
    expect(resolved.locked).toBe(false)
  })

  it('does not subtract points — v1 never punishes a wrong tap', () => {
    const state = newGame()
    const [a, b] = mismatchIds(state)
    expect(flipCard(flipCard(state, a), b).matches).toBe(0)
  })
})

describe('input locking', () => {
  it('refuses a third card while a pair is being judged', () => {
    const state = newGame()
    const [a, b] = mismatchIds(state)
    const locked = flipCard(flipCard(state, a), b)
    const third = state.cards.find((c) => c.instanceId !== a && c.instanceId !== b)!

    expect(canFlip(locked, third.instanceId)).toBe(false)
    expect(flipCard(locked, third.instanceId)).toBe(locked)
  })

  it('absorbs a burst of rapid taps as a single attempt', () => {
    const state = newGame()
    const [a, b] = mismatchIds(state)

    let next = state
    for (const id of [a, a, b, b, a, b]) {
      next = flipCard(next, id)
    }

    expect(next.attempts).toBe(1)
    expect(next.revealed).toHaveLength(2)
  })

  it('returns the identical object for a rejected tap, so nothing re-renders', () => {
    const state = newGame()
    const [a, b] = mismatchIds(state)
    const locked = flipCard(flipCard(state, a), b)

    expect(flipCard(locked, a)).toBe(locked)
  })
})

describe('resolvePending', () => {
  it('is a no-op when nothing is pending', () => {
    const state = newGame()
    expect(resolvePending(state)).toBe(state)
  })

  it('keeps input locked when it resolves after the level has ended', () => {
    let state = newGame()
    state = playPair(state, 0)
    const [a, b] = pairIds(state, 1)
    const resolved = resolvePending(flipCard(flipCard(state, a), b))

    expect(resolved.status).toBe('cleared')
    expect(resolved.locked).toBe(true)
  })
})

describe('the timer', () => {
  it('counts down and stays running while time is left', () => {
    const state = tick(newGame(), 10)
    expect(state.timeRemaining).toBe(20)
    expect(state.status).toBe('running')
  })

  it('ends the level and locks input when it reaches zero', () => {
    const state = tick(newGame(), level.timeLimit)

    expect(state.timeRemaining).toBe(0)
    expect(state.status).toBe('timeout')
    expect(state.locked).toBe(true)
    expect(isFinished(state)).toBe(true)
  })

  it('never reports negative time remaining', () => {
    expect(tick(newGame(), 999).timeRemaining).toBe(0)
  })

  it('treats a float residue as zero rather than one more ceiling second', () => {
    // Summing fractional deltas is exactly how the real clock advances.
    let state = newGame()
    for (let i = 0; i < level.timeLimit / 0.2; i += 1) {
      state = tick(state, 0.2)
    }

    expect(state.timeRemaining).toBe(0)
    expect(Math.ceil(state.timeRemaining)).toBe(0)
    expect(state.status).toBe('timeout')
  })

  it('ignores a zero or negative delta', () => {
    const state = newGame()
    expect(tick(state, 0)).toBe(state)
    expect(tick(state, -5)).toBe(state)
  })

  it('cannot turn a cleared level into a timeout', () => {
    let state = playPair(newGame(), 0)
    state = playPair(state, 1)
    expect(state.status).toBe('cleared')

    expect(tick(state, 999)).toBe(state)
    expect(tick(state, 999).status).toBe('cleared')
  })

  it('rejects flips once time has run out, mid-animation included', () => {
    const state = newGame()
    const [a, b] = mismatchIds(state)

    // Time expires while a mismatch is still face-up.
    const expired = tick(flipCard(flipCard(state, a), b), level.timeLimit)

    expect(expired.status).toBe('timeout')
    const third = state.cards.find((c) => c.instanceId !== a && c.instanceId !== b)!
    expect(flipCard(resolvePending(expired), third.instanceId)).toBeTruthy()
    expect(canFlip(resolvePending(expired), third.instanceId)).toBe(false)
  })
})

describe('level completion', () => {
  it('clears once every pair is found', () => {
    let state = playPair(newGame(), 0)
    expect(state.status).toBe('running')

    state = playPair(state, 1)

    expect(state.status).toBe('cleared')
    expect(state.matches).toBe(level.pairs)
    expect(state.cards.every((c) => c.state === 'matched')).toBe(true)
  })

  it('tracks the best streak across the level, not the current one', () => {
    // Four pairs, so two faces are still hidden after two matches and a
    // mismatch is actually possible.
    let state = newGame({ ...level, rows: 4, columns: 2, pairs: 4 })
    state = playPair(state, 0)
    state = playPair(state, 1)
    expect(state.bestStreak).toBe(2)

    const [a, b] = mismatchIds(state)
    state = resolvePending(flipCard(flipCard(state, a), b))

    expect(state.streak).toBe(0)
    expect(state.bestStreak).toBe(2)
  })
})

describe('timeUsed and toLevelResult', () => {
  it('reports elapsed time, clamped to the level limit', () => {
    expect(timeUsed(newGame())).toBe(0)
    expect(timeUsed(tick(newGame(), 12))).toBe(12)
    expect(timeUsed(tick(newGame(), 999))).toBe(level.timeLimit)
  })

  it('packages the level statistics for the store', () => {
    let state = playPair(newGame(), 0)
    state = tick(state, 8.4)
    state = playPair(state, 1)

    const result = toLevelResult(state)

    expect(result.levelId).toBe(level.id)
    expect(result.matches).toBe(2)
    expect(result.attempts).toBe(2)
    expect(result.bestStreak).toBe(2)
    expect(result.timeUsed).toBe(8)
  })
})

describe('scoring integration', () => {
  it('banks match points and a growing streak bonus as pairs are found', () => {
    let state = playPair(newGame(), 0)
    expect(state.streakBonus).toBe(0)
    expect(currentScore(state)).toBe(config.scoring.matchPoints)

    state = playPair(state, 1)
    expect(state.streakBonus).toBe(config.scoring.streakBonusPerLevel)
    expect(currentScore(state)).toBe(
      config.scoring.matchPoints * 2 + config.scoring.streakBonusPerLevel,
    )
  })

  it('withholds the time bonus until the level is actually cleared', () => {
    const state = tick(newGame(), 5)
    expect(scoreBreakdown(state).timeBonus).toBe(0)
  })

  it('adds the time bonus once the level is cleared', () => {
    let state = newGame()
    state = tick(state, 10)
    state = playPair(state, 0)
    state = playPair(state, 1)

    const breakdown = scoreBreakdown(state)

    expect(state.status).toBe('cleared')
    expect(breakdown.matchScore).toBe(config.scoring.matchPoints * 2)
    expect(breakdown.streakBonus).toBe(config.scoring.streakBonusPerLevel)
    expect(breakdown.timeBonus).toBe(20 * config.scoring.timeBonusPerSecond)
    expect(breakdown.clearBonus).toBe(config.scoring.clearBonus)
    // Two flips, two matches: perfect accuracy on a cleared board.
    expect(breakdown.accuracyBonus).toBe(config.scoring.accuracyBonusMax)
    expect(breakdown.subtotal).toBe(
      breakdown.matchScore +
        breakdown.streakBonus +
        breakdown.accuracyBonus +
        breakdown.speedBonus +
        breakdown.timeBonus +
        breakdown.clearBonus,
    )
    expect(breakdown.total).toBe(Math.round(breakdown.subtotal * breakdown.multiplier))
  })

  it('scores a timed-out level on its matches alone', () => {
    let state = playPair(newGame(), 0)
    state = tick(state, level.timeLimit)

    const result = toLevelResult(state)

    expect(state.status).toBe('timeout')
    expect(result.breakdown.timeBonus).toBe(0)
    expect(result.breakdown.clearBonus).toBe(0)
    expect(result.breakdown.matchScore).toBe(config.scoring.matchPoints)
    // The pace was far too slow for any speed bonus.
    expect(result.breakdown.speedBonus).toBe(0)
    expect(result.score).toBe(result.breakdown.total)
  })

  it('weights the score by the level multiplier', () => {
    const plain = playPair(playPair(newGame(), 0), 1)
    const doubled = playPair(playPair(newGame({ ...level, scoreMultiplier: 2 }), 0), 1)

    expect(scoreBreakdown(doubled).subtotal).toBe(scoreBreakdown(plain).subtotal)
    expect(scoreBreakdown(doubled).total).toBe(scoreBreakdown(plain).total * 2)
    expect(currentScore(doubled)).toBe(currentScore(plain) * 2)
  })

  it('rewards an unbroken run over the same matches with a break', () => {
    // Three pairs, so a mismatch is still available after the first match.
    const threePairs: LevelConfig = { ...level, rows: 3, columns: 2, pairs: 3 }

    const unbroken = playPair(playPair(newGame(threePairs), 0), 1)

    let broken = playPair(newGame(threePairs), 0)
    const [a, b] = mismatchIds(broken)
    broken = resolvePending(flipCard(flipCard(broken, a), b))
    broken = playPair(broken, 1)

    expect(unbroken.streakBonus).toBeGreaterThan(broken.streakBonus)
    expect(currentScore(unbroken)).toBeGreaterThan(currentScore(broken))
  })

  it('carries the total into the level result', () => {
    const state = playPair(playPair(newGame(), 0), 1)
    const result = toLevelResult(state)

    expect(result.score).toBe(scoreBreakdown(state).total)
    expect(result.score).toBeGreaterThan(0)
  })
})
