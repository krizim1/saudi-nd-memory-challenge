import { config } from '../app/config'
import { IndexedDbLeaderboardRepository } from './indexedDbLeaderboardRepository'
import type { LeaderboardRepository } from './leaderboardRepository'
import { MemoryLeaderboardRepository } from './memoryLeaderboardRepository'

/**
 * Picks the best storage the browser actually offers.
 *
 * IndexedDB is preferred because standings should survive a reload, but
 * private-browsing modes and locked-down kiosks can refuse it. Rather
 * than let that surface as an error on a public screen, the session
 * falls back to memory and carries on.
 */
export function createLeaderboardRepository(
  storageLimit: number = config.leaderboard.storageLimit,
): LeaderboardRepository {
  if (typeof indexedDB === 'undefined') {
    return new MemoryLeaderboardRepository(storageLimit)
  }

  return new IndexedDbLeaderboardRepository(storageLimit)
}

/**
 * Wraps a repository so a storage failure degrades to memory instead of
 * rejecting.
 *
 * `createLeaderboardRepository` can only check whether IndexedDB exists;
 * it cannot know whether a write will be refused later. This guard is
 * what covers that case at runtime.
 */
export function withMemoryFallback(
  primary: LeaderboardRepository,
  storageLimit: number = config.leaderboard.storageLimit,
): LeaderboardRepository {
  const fallback = new MemoryLeaderboardRepository(storageLimit)
  let degraded = false

  const degradeTo = (error: unknown) => {
    if (!degraded) {
      degraded = true
      console.warn('[leaderboard] Storage unavailable, continuing in memory.', error)
    }
    return fallback
  }

  return {
    async list(limit) {
      if (degraded) return fallback.list(limit)
      try {
        return await primary.list(limit)
      } catch (error) {
        return degradeTo(error).list(limit)
      }
    },

    async add(entry) {
      if (degraded) return fallback.add(entry)
      try {
        return await primary.add(entry)
      } catch (error) {
        return degradeTo(error).add(entry)
      }
    },

    async addMany(entries) {
      if (degraded) return fallback.addMany(entries)
      try {
        return await primary.addMany(entries)
      } catch (error) {
        return degradeTo(error).addMany(entries)
      }
    },

    async clear() {
      if (degraded) return fallback.clear()
      try {
        await primary.clear()
      } catch (error) {
        await degradeTo(error).clear()
      }
    },
  }
}
