import { describe, expect, it } from 'vitest'

import {
  cardCountForLevel,
  getLevelByIndex,
  isLastLevel,
  levelCount,
  levels,
  validateLevels,
} from './levels'
import type { LevelConfig } from './types'

describe('level configuration', () => {
  it('ships three levels', () => {
    expect(levelCount).toBe(3)
  })

  it('gives every configured level a grid that exactly fits its pairs', () => {
    expect(validateLevels()).toEqual([])
  })

  it('deals two cards per pair', () => {
    for (const level of levels) {
      expect(cardCountForLevel(level)).toBe(level.pairs * 2)
      expect(cardCountForLevel(level)).toBe(level.rows * level.columns)
    }
  })

  it('grows in size and time across the sequence', () => {
    for (let i = 1; i < levels.length; i += 1) {
      expect(levels[i]!.pairs).toBeGreaterThan(levels[i - 1]!.pairs)
      expect(levels[i]!.timeLimit).toBeGreaterThan(levels[i - 1]!.timeLimit)
    }
  })

  it('marks only the final index as last', () => {
    expect(isLastLevel(0)).toBe(false)
    expect(isLastLevel(levelCount - 1)).toBe(true)
  })

  it('returns undefined past the end rather than throwing', () => {
    expect(getLevelByIndex(levelCount)).toBeUndefined()
  })

  it('reports a grid that cannot hold its pairs', () => {
    const broken: LevelConfig[] = [{ id: 1, rows: 3, columns: 4, pairs: 8, timeLimit: 45 }]
    expect(validateLevels(broken)).toHaveLength(1)
    expect(validateLevels(broken)[0]).toContain('Level 1')
  })

  it('reports duplicate ids and non-positive time limits', () => {
    const broken: LevelConfig[] = [
      { id: 1, rows: 3, columns: 4, pairs: 6, timeLimit: 45 },
      { id: 1, rows: 3, columns: 4, pairs: 6, timeLimit: 0 },
    ]
    const problems = validateLevels(broken)
    expect(problems.some((p) => p.includes('Duplicate'))).toBe(true)
    expect(problems.some((p) => p.includes('timeLimit'))).toBe(true)
  })
})
