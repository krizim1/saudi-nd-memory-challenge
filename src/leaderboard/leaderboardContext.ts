import { createContext, useContext } from 'react'

import type { LeaderboardEntry, Player } from '../game/types'

export interface LeaderboardApi {
  entries: LeaderboardEntry[]
  loading: boolean
  /** Ids of the rows recorded by the latest round, so the board can spotlight them. */
  recentIds: ReadonlySet<string>
  /** Records finished players and refreshes the standings. */
  submit: (players: readonly Player[]) => Promise<void>
  clear: () => Promise<void>
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
  clear: async () => {},
  refresh: async () => {},
})

export function useLeaderboard(): LeaderboardApi {
  return useContext(LeaderboardContext)
}
