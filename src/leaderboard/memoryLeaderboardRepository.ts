import type { LeaderboardEntry } from '../game/types'
import {
  createEntryId,
  rank,
  type LeaderboardRepository,
  type NewLeaderboardEntry,
} from './leaderboardRepository'

/**
 * In-memory standings.
 *
 * Used when IndexedDB is unavailable — a browser in private mode, or a
 * kiosk with storage blocked. The event still gets a working leaderboard
 * for the session; it simply does not survive a reload, which is far
 * better than the screen erroring out in front of a queue.
 */
export class MemoryLeaderboardRepository implements LeaderboardRepository {
  private entries: LeaderboardEntry[] = []

  private readonly storageLimit: number

  constructor(storageLimit: number) {
    this.storageLimit = storageLimit
  }

  async list(limit?: number): Promise<LeaderboardEntry[]> {
    const ranked = rank(this.entries)
    return limit === undefined ? ranked : ranked.slice(0, limit)
  }

  async add(entry: NewLeaderboardEntry): Promise<LeaderboardEntry> {
    const [saved] = await this.addMany([entry])
    return saved!
  }

  async addMany(entries: NewLeaderboardEntry[]): Promise<LeaderboardEntry[]> {
    const saved = entries.map((entry) => ({ ...entry, id: createEntryId() }))
    this.entries = rank([...this.entries, ...saved]).slice(0, this.storageLimit)
    return saved
  }

  async clear(): Promise<void> {
    this.entries = []
  }
}
