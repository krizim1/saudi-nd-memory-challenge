import type { LeaderboardEntry } from '../game/types'
import {
  createEntryId,
  rank,
  type LeaderboardRepository,
  type NewLeaderboardEntry,
} from './leaderboardRepository'

/** Row shape in the `leaderboard` table (see `supabase/schema.sql`). */
interface Row {
  id: string
  player_name: string
  score: number
  total_time: number
  created_at: string
  matches: number | null
  attempts: number | null
  best_streak: number | null
  levels_cleared: number | null
}

function toEntry(row: Row): LeaderboardEntry {
  return {
    id: row.id,
    playerName: row.player_name,
    score: row.score,
    totalTime: row.total_time,
    date: row.created_at,
    matches: row.matches ?? undefined,
    attempts: row.attempts ?? undefined,
    bestStreak: row.best_streak ?? undefined,
    levelsCleared: row.levels_cleared ?? undefined,
  }
}

function toRow(entry: NewLeaderboardEntry, id: string): Row {
  return {
    id,
    player_name: entry.playerName,
    score: entry.score,
    total_time: entry.totalTime,
    created_at: entry.date,
    matches: entry.matches ?? null,
    attempts: entry.attempts ?? null,
    best_streak: entry.bestStreak ?? null,
    levels_cleared: entry.levelsCleared ?? null,
  }
}

/**
 * Shared standings in a Supabase (PostgreSQL) table, over its REST API.
 *
 * Every screen pointed at the same project sees the same leaderboard, so
 * several kiosks — and the published site — share one ranking. The anon
 * key is public by design; the table's row-level security allows reading
 * and inserting only, so a visitor cannot edit or delete results.
 */
export class SupabaseLeaderboardRepository implements LeaderboardRepository {
  private readonly endpoint: string
  private readonly key: string
  private readonly storageLimit: number

  constructor(url: string, anonKey: string, storageLimit: number) {
    this.endpoint = `${url.replace(/\/+$/, '')}/rest/v1/leaderboard`
    this.key = anonKey
    this.storageLimit = storageLimit
  }

  private headers(extra: Record<string, string> = {}): HeadersInit {
    return {
      apikey: this.key,
      Authorization: `Bearer ${this.key}`,
      'Content-Type': 'application/json',
      ...extra,
    }
  }

  async list(limit?: number): Promise<LeaderboardEntry[]> {
    const cap = Math.min(limit ?? this.storageLimit, this.storageLimit)
    // Same order as `compareEntries`: score, then faster time, then earlier.
    const query = `select=*&order=score.desc,total_time.asc,created_at.asc&limit=${cap}`
    const response = await fetch(`${this.endpoint}?${query}`, { headers: this.headers() })
    if (!response.ok) throw new Error(`Supabase list failed: ${response.status}`)
    return rank(((await response.json()) as Row[]).map(toEntry))
  }

  async add(entry: NewLeaderboardEntry): Promise<LeaderboardEntry> {
    const [saved] = await this.addMany([entry])
    return saved!
  }

  async addMany(entries: NewLeaderboardEntry[]): Promise<LeaderboardEntry[]> {
    if (entries.length === 0) return []
    const rows = entries.map((entry) => toRow(entry, createEntryId()))
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: this.headers({ Prefer: 'return=minimal' }),
      body: JSON.stringify(rows),
    })
    if (!response.ok) throw new Error(`Supabase insert failed: ${response.status}`)
    return rows.map(toEntry)
  }

  /**
   * Deleting shared results is deliberately not possible with the public
   * key. Clear the table from the Supabase dashboard instead.
   */
  async clear(): Promise<void> {
    console.warn('[leaderboard] Shared standings are cleared from the Supabase dashboard.')
  }
}
