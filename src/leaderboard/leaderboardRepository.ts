/**
 * Storage-agnostic contract for leaderboard persistence.
 *
 * The game talks only to this interface, so the local IndexedDB store
 * can later be swapped for Firebase, Supabase, or a REST service backing
 * a multi-device leaderboard without a single screen changing.
 */

import type { LeaderboardEntry, Player } from '../game/types'

/** An entry before it has been given an id by the store. */
export type NewLeaderboardEntry = Omit<LeaderboardEntry, 'id'>

export interface LeaderboardRepository {
  /** Best entries first. `limit` caps how many come back. */
  list(limit?: number): Promise<LeaderboardEntry[]>
  add(entry: NewLeaderboardEntry): Promise<LeaderboardEntry>
  /** Adds several entries as one operation. */
  addMany(entries: NewLeaderboardEntry[]): Promise<LeaderboardEntry[]>
  clear(): Promise<void>
}

/**
 * The standings order: highest score, then the faster run, then whoever
 * set it first. Identical to the head-to-head tie-break, so a player
 * cannot lose a match and outrank the winner.
 */
export function compareEntries(a: LeaderboardEntry, b: LeaderboardEntry): number {
  if (a.score !== b.score) return b.score - a.score
  if (a.totalTime !== b.totalTime) return a.totalTime - b.totalTime
  return a.date.localeCompare(b.date)
}

export function rank(entries: readonly LeaderboardEntry[]): LeaderboardEntry[] {
  return [...entries].sort(compareEntries)
}

/** Turns a finished player into a leaderboard row. */
export function entryFromPlayer(player: Player, date: Date = new Date()): NewLeaderboardEntry {
  return {
    playerName: player.name,
    score: player.totalScore,
    totalTime: player.totalTime,
    date: date.toISOString(),
    matches: player.matches,
    attempts: player.attempts,
    bestStreak: player.bestStreak,
    levelsCleared: player.levelResults.filter((result) => result.breakdown.clearBonus > 0).length,
  }
}

let sequence = 0

export function createEntryId(): string {
  sequence += 1
  return `entry-${Date.now().toString(36)}-${sequence}`
}
