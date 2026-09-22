import type { LeaderboardEntry } from '../game/types'
import {
  ClearRejectedError,
  createEntryId,
  rank,
  type LeaderboardRepository,
  type NewLeaderboardEntry,
} from './leaderboardRepository'

/** Row shape in the `leaderboard` table (see `supabase/schema.sql`). */
interface Row {
  id: string
  client?: string
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

function toRow(entry: NewLeaderboardEntry, id: string, client: string): Row {
  return {
    id,
    client,
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
 * Every screen for the same client shares one ranking — several kiosks
 * and the published link alike — and each client sees only its own rows. The anon
 * key (publishable or legacy anon) is public by design; the table's row-level security allows reading
 * and inserting only, so a visitor cannot edit or delete results.
 */
export class SupabaseLeaderboardRepository implements LeaderboardRepository {
  readonly requiresPin = true

  private readonly base: string
  private readonly endpoint: string
  private readonly key: string
  private readonly storageLimit: number
  private readonly client: string

  constructor(url: string, anonKey: string, storageLimit: number, client = 'default') {
    this.base = `${url.replace(/\/+$/, '')}/rest/v1`
    this.endpoint = `${this.base}/leaderboard`
    this.key = anonKey
    this.storageLimit = storageLimit
    this.client = client
  }

  private headers(extra: Record<string, string> = {}): HeadersInit {
    return {
      apikey: this.key,
      // Legacy anon keys are JWTs and also go in Authorization; the newer
      // `sb_publishable_…` keys are not JWTs and must be sent as `apikey` only.
      ...(this.key.startsWith('sb_') ? {} : { Authorization: `Bearer ${this.key}` }),
      'Content-Type': 'application/json',
      ...extra,
    }
  }

  async list(limit?: number): Promise<LeaderboardEntry[]> {
    const cap = Math.min(limit ?? this.storageLimit, this.storageLimit)
    // Same order as `compareEntries`: score, then faster time, then earlier.
    const query = `select=*&client=eq.${encodeURIComponent(this.client)}&order=score.desc,total_time.asc,created_at.asc&limit=${cap}`
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
    const rows = entries.map((entry) => toRow(entry, createEntryId(), this.client))
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: this.headers({ Prefer: 'return=minimal' }),
      body: JSON.stringify(rows),
    })
    if (!response.ok) throw new Error(`Supabase insert failed: ${response.status}`)
    return rows.map(toEntry)
  }

  /**
   * Clears this client's standings through the `reset_leaderboard`
   * database function, which checks the client's PIN. The public key can
   * never delete rows directly.
   */
  async clear(pin?: string): Promise<void> {
    const response = await fetch(`${this.base}/rpc/reset_leaderboard`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({ p_client: this.client, p_pin: pin ?? '' }),
    })
    if (!response.ok) throw new Error(`Supabase reset failed: ${response.status}`)
    const result = (await response.json()) as number
    if (result === -2) throw new ClearRejectedError('locked')
    if (result < 0) throw new ClearRejectedError('invalid-pin')
  }
}
