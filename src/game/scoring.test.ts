import { describe, expect, it } from 'vitest'

import { config, type ScoringConfig } from '../app/config'
import {
  matchScoreFor,
  runningScore,
  scoreLevel,
  streakBonusFor,
  timeBonusFor,
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

describe('runningScore', () => {
  it('is matches plus streak bonus, with no time bonus banked', () => {
    expect(runningScore(3, 75)).toBe(3 * scoring.matchPoints + 75)
  })
})

describe('scoreLevel', () => {
  it('adds the three components into the total', () => {
    const breakdown = scoreLevel({
      matches: 6,
      streakBonus: 150,
      timeRemaining: 20,
      cleared: true,
    })

    expect(breakdown.matchScore).toBe(600)
    expect(breakdown.streakBonus).toBe(150)
    expect(breakdown.timeBonus).toBe(200)
    expect(breakdown.total).toBe(950)
  })

  it('drops the time bonus but keeps the earned points on a timeout', () => {
    const breakdown = scoreLevel({
      matches: 4,
      streakBonus: 50,
      timeRemaining: 0,
      cleared: false,
    })

    expect(breakdown.timeBonus).toBe(0)
    expect(breakdown.total).toBe(450)
  })

  it('never subtracts for incorrect attempts — v1 does not punish', () => {
    expect(scoring.incorrectPenalty).toBe(0)

    const careful = scoreLevel({ matches: 6, streakBonus: 0, timeRemaining: 10, cleared: true })
    const reckless = scoreLevel({ matches: 6, streakBonus: 0, timeRemaining: 10, cleared: true })

    expect(reckless.total).toBe(careful.total)
  })

  it('scores an untouched level at zero', () => {
    expect(
      scoreLevel({ matches: 0, streakBonus: 0, timeRemaining: 0, cleared: false }).total,
    ).toBe(0)
  })

  it('rewards a faster clear of the same board', () => {
    const fast = scoreLevel({ matches: 6, streakBonus: 0, timeRemaining: 30, cleared: true })
    const slow = scoreLevel({ matches: 6, streakBonus: 0, timeRemaining: 5, cleared: true })

    expect(fast.total).toBeGreaterThan(slow.total)
  })
})
