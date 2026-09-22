import { createContext, useContext } from 'react'

import type { LeaderboardEntry, Player } from '../game/types'

export type ClearResult = 'cleared' | 'invalid-pin' | 'locked' | 'failed'

export interface LeaderboardApi {
  entries: LeaderboardEntry[]
  loading: boolean
  /** Ids of the rows recorded by the latest round, so the board can spotlight them. */
  recentIds: ReadonlySet<string>
  /** Records finished players and refreshes the standings. */
  submit: (players: readonly Player[]) => Promise<void>
  /** Clears the standings; a shared database needs the client's PIN. */
  clear: (pin?: string) => Promise<ClearResult>
  /** True when clearing needs a PIN. */
  requiresPin: boolean
  refresh: () => Promise<void>
}

/**
 * Defaults to an inert leaderboard so a screen rendered outside the
 * provider shows its empty state rather than throwing.
 */
export const LeaderboardContext = createContext<LeaderboardApi>({
  entries: [],
  loading: false,
  recentIds: new Set<string>(),
  submit: async () => {},
  clear: async () => 'cleared',
  requiresPin: false,
  refresh: async () => {},
})

export function useLeaderboard(): LeaderboardApi {
  return useContext(LeaderboardContext)
}
