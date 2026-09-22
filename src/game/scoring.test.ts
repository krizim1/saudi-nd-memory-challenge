import { describe, expect, it } from 'vitest'

import { config, type ScoringConfig } from '../app/config'
import {
  accuracyBonusFor,
  clearBonusFor,
  matchScoreFor,
  runningScore,
  scoreLevel,
  speedBonusFor,
  streakBonusFor,
  timeBonusFor,
  type LevelPerformance,
} from './scoring'

const scoring: ScoringConfig = config.scoring

describe('streakBonusFor', () => {
  it('pays nothing for the first match of a run', () => {
    expect(streakBonusFor(0)).toBe(0)
    expect(streakBonusFor(1)).toBe(0)
  })

  it('grows with each consecutive match', () => {
    expect(streakBonusFor(2)).toBe(scoring.streakBonusPerLevel)
    expect(streakBonusFor(3)).toBe(scoring.streakBonusPerLevel * 2)
    expect(streakBonusFor(4)).toBe(scoring.streakBonusPerLevel * 3)
  })

  it('stops growing at the configured cap', () => {
    const capped = (scoring.maxStreakMultiplier - 1) * scoring.streakBonusPerLevel

    expect(streakBonusFor(scoring.maxStreakMultiplier)).toBe(capped)
    expect(streakBonusFor(scoring.maxStreakMultiplier + 1)).toBe(capped)
    expect(streakBonusFor(99)).toBe(capped)
  })

  it('honours an alternative scoring table', () => {
    const generous: ScoringConfig = { ...scoring, streakBonusPerLevel: 50, maxStreakMultiplier: 3 }

    expect(streakBonusFor(2, generous)).toBe(50)
    expect(streakBonusFor(9, generous)).toBe(100)
  })
})

describe('matchScoreFor', () => {
  it('pays the configured points per pair', () => {
    expect(matchScoreFor(0)).toBe(0)
    expect(matchScoreFor(6)).toBe(6 * scoring.matchPoints)
  })

  it('never returns a negative score', () => {
    expect(matchScoreFor(-3)).toBe(0)
  })
})

describe('timeBonusFor', () => {
  it('pays per whole second left on a cleared level', () => {
    expect(timeBonusFor(12.9, true)).toBe(12 * scoring.timeBonusPerSecond)
  })

  it('pays nothing when the level was not cleared', () => {
    expect(timeBonusFor(12, false)).toBe(0)
  })

  it('pays nothing at zero or below', () => {
    expect(timeBonusFor(0, true)).toBe(0)
    expect(timeBonusFor(-4, true)).toBe(0)
  })
})

describe('accuracyBonusFor', () => {
  it('pays the full bonus for a perfect memory on a cleared board', () => {
    expect(accuracyBonusFor(6, 6, 6)).toBe(scoring.accuracyBonusMax)
  })

  it('scales with the share of attempts that were matches', () => {
    expect(accuracyBonusFor(6, 12, 6)).toBe(Math.round(scoring.accuracyBonusMax * 0.5))
  })

  it('cannot be farmed by stopping after one careful match', () => {
    // 1 of 1 attempts is perfect accuracy, but only a sixth of the board.
    expect(accuracyBonusFor(1, 1, 6)).toBe(Math.round(scoring.accuracyBonusMax / 6))
  })

  it('pays nothing without a match', () => {
    expect(accuracyBonusFor(0, 5, 6)).toBe(0)
    expect(accuracyBonusFor(0, 0, 6)).toBe(0)
  })
})

describe('speedBonusFor', () => {
  it('pays the full bonus at or under the fast pace', () => {
    expect(speedBonusFor(scoring.speedFastSeconds * 6, 6, 6, 6)).toBe(scoring.speedBonusMax)
  })

  it('pays nothing at or over the slow pace', () => {
    expect(speedBonusFor(scoring.speedSlowSeconds * 6, 6, 6, 6)).toBe(0)
  })

  it('pays proportionally between the two paces', () => {
    const midpoint = (scoring.speedFastSeconds + scoring.speedSlowSeconds) / 2
    expect(speedBonusFor(midpoint * 6, 6, 6, 6)).toBe(Math.round(scoring.speedBonusMax / 2))
  })

  it('scales with how much of the board was found', () => {
    expect(speedBonusFor(scoring.speedFastSeconds * 3, 3, 3, 6)).toBe(
      Math.round(scoring.speedBonusMax / 2),
    )
  })
})

describe('clearBonusFor', () => {
  it('pays only for a cleared board', () => {
    expect(clearBonusFor(true)).toBe(scoring.clearBonus)
    expect(clearBonusFor(false)).toBe(0)
  })
})

describe('runningScore', () => {
  it('is matches plus streak bonus, weighted by the level', () => {
    expect(runningScore(3, 75)).toBe(3 * scoring.matchPoints + 75)
    expect(runningScore(3, 75, 2)).toBe((3 * scoring.matchPoints + 75) * 2)
  })
})

/** A cleared six-pair level: 6 matches in 8 attempts, 25s used of 45. */
const cleared: LevelPerformance = {
  matches: 6,
  attempts: 8,
  pairs: 6,
  streakBonus: 150,
  timeRemaining: 20,
  timeLimit: 45,
  cleared: true,
}

describe('scoreLevel', () => {
  it('adds every component into the subtotal', () => {
    const b = scoreLevel(cleared)

    expect(b.matchScore).toBe(600)
    expect(b.streakBonus).toBe(150)
    expect(b.accuracyBonus).toBe(accuracyBonusFor(6, 8, 6))
    expect(b.speedBonus).toBe(speedBonusFor(25, 8, 6, 6))
    expect(b.timeBonus).toBe(200)
    expect(b.clearBonus).toBe(scoring.clearBonus)
    expect(b.subtotal).toBe(
      b.matchScore + b.streakBonus + b.accuracyBonus + b.speedBonus + b.timeBonus + b.clearBonus,
    )
    expect(b.multiplier).toBe(1)
    expect(b.total).toBe(b.subtotal)
  })

  it('weights the whole subtotal by the level multiplier', () => {
    const plain = scoreLevel(cleared)
    const hard = scoreLevel({ ...cleared, multiplier: 1.5 })

    expect(hard.subtotal).toBe(plain.subtotal)
    expect(hard.total).toBe(Math.round(plain.subtotal * 1.5))
  })

  it('drops the time and clear bonuses but keeps earned points on a timeout', () => {
    const b = scoreLevel({ ...cleared, matches: 4, timeRemaining: 0, cleared: false })

    expect(b.timeBonus).toBe(0)
    expect(b.clearBonus).toBe(0)
    expect(b.matchScore).toBe(400)
    expect(b.total).toBeGreaterThan(0)
  })

  it('never subtracts for incorrect attempts — only the accuracy bonus shrinks', () => {
    expect(scoring.incorrectPenalty).toBe(0)

    const careful = scoreLevel({ ...cleared, attempts: 6 })
    const sloppy = scoreLevel({ ...cleared, attempts: 30 })

    expect(sloppy.matchScore).toBe(careful.matchScore)
    expect(sloppy.accuracyBonus).toBeLessThan(careful.accuracyBonus)
    expect(sloppy.total).toBeGreaterThan(0)
  })

  it('scores an untouched level at zero', () => {
    expect(
      scoreLevel({ ...cleared, matches: 0, attempts: 0, streakBonus: 0, timeRemaining: 0, cleared: false })
        .total,
    ).toBe(0)
  })

  it('rewards a faster clear of the same board', () => {
    const fast = scoreLevel({ ...cleared, timeRemaining: 30 })
    const slow = scoreLevel({ ...cleared, timeRemaining: 5 })

    expect(fast.total).toBeGreaterThan(slow.total)
  })

  it('ranks a harder level above the same play on an easier one', () => {
    expect(scoreLevel({ ...cleared, multiplier: 2 }).total).toBeGreaterThan(scoreLevel(cleared).total)
  })
})
