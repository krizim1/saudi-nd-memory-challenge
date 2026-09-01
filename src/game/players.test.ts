import { describe, expect, it } from 'vitest'

import { compareOutcome, createPlayer } from './players'
import type { Player } from './types'

function player(overrides: Partial<Player>): Player {
  return { ...createPlayer('لاعب'), ...overrides }
}

describe('createPlayer', () => {
  it('trims the name and starts every total at zero', () => {
    const created = createPlayer('  عبدالله  ')
    expect(created.name).toBe('عبدالله')
    expect(created.totalScore).toBe(0)
    expect(created.levelResults).toEqual([])
  })

  it('gives each player a distinct id', () => {
    expect(createPlayer('أ').id).not.toBe(createPlayer('ب').id)
  })
})

describe('compareOutcome', () => {
  it('awards the win to the higher score and reports the gap', () => {
    const a = player({ name: 'عبدالله', totalScore: 8420 })
    const b = player({ name: 'محمد', totalScore: 7950 })

    const outcome = compareOutcome(a, b)
    expect(outcome.winner?.name).toBe('عبدالله')
    expect(outcome.loser?.name).toBe('محمد')
    expect(outcome.isDraw).toBe(false)
    expect(outcome.scoreDifference).toBe(470)
  })

  it('works regardless of argument order', () => {
    const a = player({ name: 'أ', totalScore: 100 })
    const b = player({ name: 'ب', totalScore: 300 })
    expect(compareOutcome(a, b).winner?.name).toBe('ب')
    expect(compareOutcome(b, a).winner?.name).toBe('ب')
  })

  it('breaks an equal score with the faster total time', () => {
    const fast = player({ name: 'سريع', totalScore: 500, totalTime: 90 })
    const slow = player({ name: 'بطيء', totalScore: 500, totalTime: 140 })
    expect(compareOutcome(slow, fast).winner?.name).toBe('سريع')
  })

  it('breaks an equal score and time with the longer streak', () => {
    const streaky = player({ name: 'متتابع', totalScore: 500, totalTime: 90, bestStreak: 6 })
    const other = player({ name: 'آخر', totalScore: 500, totalTime: 90, bestStreak: 3 })
    expect(compareOutcome(other, streaky).winner?.name).toBe('متتابع')
  })

  it('reports a draw only when every tie-break is exhausted', () => {
    const a = player({ totalScore: 500, totalTime: 90, bestStreak: 4 })
    const b = player({ totalScore: 500, totalTime: 90, bestStreak: 4 })

    const outcome = compareOutcome(a, b)
    expect(outcome.isDraw).toBe(true)
    expect(outcome.winner).toBeNull()
    expect(outcome.scoreDifference).toBe(0)
  })
})
