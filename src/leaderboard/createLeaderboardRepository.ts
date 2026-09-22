import { config } from '../app/config'
import { DEFAULT_CLIENT, getClientId } from '../client/clientId'
import { IndexedDbLeaderboardRepository } from './indexedDbLeaderboardRepository'
import { ClearRejectedError, type LeaderboardRepository } from './leaderboardRepository'
import { MemoryLeaderboardRepository } from './memoryLeaderboardRepository'
import { SupabaseLeaderboardRepository } from './supabaseLeaderboardRepository'

/**
 * The shared database, when the build was given one.
 *
 * Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (a `.env.local`
 * file locally, repository variables for the GitHub Pages build). Without
 * them the game keeps its standings in this browser only.
 */
export function createRemoteLeaderboardRepository(
  storageLimit: number = config.leaderboard.storageLimit,
  client: string = getClientId(),
): LeaderboardRepository | null {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
  if (!url || !key) return null
  return new SupabaseLeaderboardRepository(url, key, storageLimit, client)
}

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
  client: string = getClientId(),
): LeaderboardRepository {
  if (typeof indexedDB === 'undefined') {
    return new MemoryLeaderboardRepository(storageLimit)
  }

  // One local database per client, so clients sharing a machine stay apart.
  const suffix = client === DEFAULT_CLIENT ? '' : `:${client}`
  return new IndexedDbLeaderboardRepository(storageLimit, `saudi-memory-challenge${suffix}`)
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
    requiresPin: primary.requiresPin,

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

    async clear(pin) {
      if (degraded) return fallback.clear()
      try {
        await primary.clear(pin)
      } catch (error) {
        // A wrong PIN is an answer, not an outage: report it, stay online.
        if (error instanceof ClearRejectedError) throw error
        await degradeTo(error).clear()
      }
    },
  }
}
