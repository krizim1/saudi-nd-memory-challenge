import { IDBFactory } from 'fake-indexeddb'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createPlayer } from '../game/players'
import type { LeaderboardEntry } from '../game/types'
import { createLeaderboardRepository, withMemoryFallback } from './createLeaderboardRepository'
import { IndexedDbLeaderboardRepository } from './indexedDbLeaderboardRepository'
import {
  compareEntries,
  entryFromPlayer,
  rank,
  type LeaderboardRepository,
  type NewLeaderboardEntry,
} from './leaderboardRepository'
import { MemoryLeaderboardRepository } from './memoryLeaderboardRepository'

function entry(overrides: Partial<NewLeaderboardEntry> = {}): NewLeaderboardEntry {
  return {
    playerName: 'لاعب',
    score: 1000,
    totalTime: 100,
    date: '2026-09-01T10:00:00.000Z',
    ...overrides,
  }
}

/**
 * One suite, run against every implementation.
 *
 * The point of the repository abstraction is that a future Firebase or
 * REST backend can be dropped in; this is the contract it would have to
 * satisfy, so it is written once and shared.
 */
function describeRepositoryContract(
  name: string,
  create: (storageLimit: number) => LeaderboardRepository,
) {
  describe(`${name} (repository contract)`, () => {
    it('starts empty', async () => {
      await expect(create(10).list()).resolves.toEqual([])
    })

    it('stores an entry and gives it an id', async () => {
      const repository = create(10)
      const saved = await repository.add(entry({ playerName: 'عبدالله' }))

      expect(saved.id).toBeTruthy()
      expect(saved.playerName).toBe('عبدالله')
      await expect(repository.list()).resolves.toHaveLength(1)
    })

    it('ranks by score, then by the faster run', async () => {
      const repository = create(10)
      await repository.addMany([
        entry({ playerName: 'ثالث', score: 500, totalTime: 90 }),
        entry({ playerName: 'أول', score: 900, totalTime: 120 }),
        entry({ playerName: 'ثاني', score: 500, totalTime: 60 }),
      ])

      const listed = await repository.list()

      expect(listed.map((e) => e.playerName)).toEqual(['أول', 'ثاني', 'ثالث'])
    })

    it('caps how many entries it returns', async () => {
      const repository = create(10)
      await repository.addMany([entry(), entry(), entry(), entry()])

      await expect(repository.list(2)).resolves.toHaveLength(2)
    })

    it('keeps only the best entries once the store is full', async () => {
      const repository = create(3)
      await repository.addMany([
        entry({ playerName: 'أ', score: 100 }),
        entry({ playerName: 'ب', score: 400 }),
        entry({ playerName: 'ج', score: 300 }),
        entry({ playerName: 'د', score: 200 }),
      ])

      const listed = await repository.list()

      expect(listed).toHaveLength(3)
      expect(listed.map((e) => e.playerName)).toEqual(['ب', 'ج', 'د'])
    })

    it('gives distinct ids to identical entries', async () => {
      const repository = create(10)
      const saved = await repository.addMany([entry(), entry()])

      expect(saved[0]!.id).not.toBe(saved[1]!.id)
    })

    it('empties on clear', async () => {
      const repository = create(10)
      await repository.addMany([entry(), entry()])

      await repository.clear()

      await expect(repository.list()).resolves.toEqual([])
    })
  })
}

describeRepositoryContract(
  'MemoryLeaderboardRepository',
  (limit) => new MemoryLeaderboardRepository(limit),
)

describe('IndexedDB', () => {
  beforeEach(() => {
    // A fresh database per test, so no state leaks between them.
    globalThis.indexedDB = new IDBFactory()
  })

  describeRepositoryContract(
    'IndexedDbLeaderboardRepository',
    (limit) => new IndexedDbLeaderboardRepository(limit),
  )

  it('survives a new repository instance over the same database', async () => {
    await new IndexedDbLeaderboardRepository(10).add(entry({ playerName: 'باقٍ' }))

    const reopened = await new IndexedDbLeaderboardRepository(10).list()

    expect(reopened.map((e) => e.playerName)).toEqual(['باقٍ'])
  })
})

describe('compareEntries', () => {
  const base: LeaderboardEntry = { id: 'a', ...entry() }

  it('puts the higher score first', () => {
    expect(compareEntries({ ...base, score: 900 }, { ...base, score: 500 })).toBeLessThan(0)
  })

  it('breaks an equal score with the faster time', () => {
    expect(compareEntries({ ...base, totalTime: 50 }, { ...base, totalTime: 90 })).toBeLessThan(0)
  })

  it('breaks an equal score and time with the earlier date', () => {
    const early = { ...base, date: '2026-09-01T09:00:00.000Z' }
    const late = { ...base, date: '2026-09-01T11:00:00.000Z' }

    expect(compareEntries(early, late)).toBeLessThan(0)
  })

  it('leaves the input array untouched when ranking', () => {
    const entries = [
      { ...base, id: 'a', score: 100 },
      { ...base, id: 'b', score: 900 },
    ]
    const original = [...entries]

    rank(entries)

    expect(entries).toEqual(original)
  })
})

describe('entryFromPlayer', () => {
  it('carries the player name, total score and total time', () => {
    const player = { ...createPlayer('عبدالله'), totalScore: 8420, totalTime: 140 }
    const date = new Date('2026-09-01T12:00:00.000Z')

    expect(entryFromPlayer(player, date)).toEqual({
      playerName: 'عبدالله',
      score: 8420,
      totalTime: 140,
      date: '2026-09-01T12:00:00.000Z',
    })
  })
})

describe('createLeaderboardRepository', () => {
  it('uses IndexedDB when the browser offers it', () => {
    globalThis.indexedDB = new IDBFactory()
    expect(createLeaderboardRepository(10)).toBeInstanceOf(IndexedDbLeaderboardRepository)
  })

  it('falls back to memory when IndexedDB is absent', () => {
    const saved = globalThis.indexedDB
    // @ts-expect-error deliberately removing the global for this check
    delete globalThis.indexedDB

    expect(createLeaderboardRepository(10)).toBeInstanceOf(MemoryLeaderboardRepository)

    globalThis.indexedDB = saved
  })
})

describe('withMemoryFallback', () => {
  const broken: LeaderboardRepository = {
    list: async () => {
      throw new Error('storage blocked')
    },
    add: async () => {
      throw new Error('storage blocked')
    },
    addMany: async () => {
      throw new Error('storage blocked')
    },
    clear: async () => {
      throw new Error('storage blocked')
    },
  }

  it('keeps the leaderboard working when storage refuses a write', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const repository = withMemoryFallback(broken, 10)

    await expect(repository.add(entry({ playerName: 'عبدالله' }))).resolves.toBeTruthy()
    await expect(repository.list()).resolves.toHaveLength(1)

    warn.mockRestore()
  })

  it('warns once, not on every call', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const repository = withMemoryFallback(broken, 10)

    await repository.list()
    await repository.add(entry())
    await repository.list()

    expect(warn).toHaveBeenCalledOnce()
    warn.mockRestore()
  })
})
